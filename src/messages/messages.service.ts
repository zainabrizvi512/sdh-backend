import {
    Injectable, BadRequestException, ForbiddenException, NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, MoreThan, Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Message, MessageType } from './message.entity';
import { MessageAttachment } from './messageAttachment.entity';
import { MessageRead } from './messageRead.entity';
import { SendMessageDto } from './dto/send-message.dto';
import { MarkReadDto } from './dto/mark-read.dto';
import { Group } from 'src/group/group.entity';

@Injectable()
export class MessagesService {
    constructor(
        @InjectRepository(Message) private readonly msgRepo: Repository<Message>,
        @InjectRepository(MessageAttachment) private readonly attRepo: Repository<MessageAttachment>,
        @InjectRepository(MessageRead) private readonly readRepo: Repository<MessageRead>,
        @InjectRepository(Group) private readonly groupRepo: Repository<Group>,
        @InjectRepository(User) private readonly userRepo: Repository<User>,
    ) { }

    private async assertMember(userId: string, groupId: string): Promise<{ group: Group; user: User }> {
        const group = await this.groupRepo.findOne({ where: { id: groupId } });
        if (!group) throw new NotFoundException('Group not found');
        const user = await this.userRepo.findOne({ where: { sub: userId } });
        if (!user) throw new NotFoundException('User not found');

        const isMember = group.members.some(m => m.sub === userId) || group.owner.sub === userId;
        if (!isMember) throw new ForbiddenException('Not a member of this group');
        return { group, user };
    }

    async sendMessage(currentUserId: string, groupId: string, dto: SendMessageDto): Promise<Message> {
        const { group, user } = await this.assertMember(currentUserId, groupId);

        if (dto.type === MessageType.TEXT && !dto.text && (!dto.attachments || dto.attachments.length === 0)) {
            throw new BadRequestException('Text message must have text or attachments');
        }

        if (dto.type === MessageType.IMAGE && (!dto.attachments || dto.attachments.length === 0)) {
            throw new BadRequestException('Image message must include at least one attachment');
        }

        const message = this.msgRepo.create({
            group,
            sender: user,
            type: dto.type,
            text: dto.text,
            attachments: (dto.attachments || []).map(a => this.attRepo.create(a)),
        });

        const saved = await this.msgRepo.save(message);
        return saved;
    }

    // Cursor pagination (simple): pass createdBefore or createdAfter
    async listMessages(currentUserId: string, groupId: string, opts: { limit?: number; beforeId?: string; afterId?: string }) {
        await this.assertMember(currentUserId, groupId);
        const limit = Math.min(Math.max(opts.limit ?? 30, 1), 100);

        let where: any = { group: { id: groupId } };
        if (opts.beforeId) {
            const before = await this.msgRepo.findOne({ where: { id: opts.beforeId } });
            if (!before) throw new NotFoundException('beforeId not found');
            where.createdAt = LessThan(before.createdAt);
        } else if (opts.afterId) {
            const after = await this.msgRepo.findOne({ where: { id: opts.afterId } });
            if (!after) throw new NotFoundException('afterId not found');
            where.createdAt = MoreThan(after.createdAt);
        }

        const items = await this.msgRepo.find({
            where,
            order: { createdAt: 'DESC' },
            take: limit,
        });

        return items;
    }

    async markRead(currentUserId: string, groupId: string, dto: MarkReadDto) {
        await this.assertMember(currentUserId, groupId);

        const msgs = await this.msgRepo.find({ where: { id: In(dto.messageIds), group: { id: groupId } } });
        const foundIds = new Set(msgs.map(m => m.id));
        const invalid = dto.messageIds.filter(id => !foundIds.has(id));
        if (invalid.length) throw new BadRequestException(`Invalid messageIds: ${invalid.join(', ')}`);

        const existing = await this.readRepo.find({ where: { user: { id: currentUserId }, message: In(msgs.map(m => m)) } });
        const existingPairs = new Set(existing.map(e => e.message.id));

        const toCreate = msgs.filter(m => !existingPairs.has(m.id)).map(m => this.readRepo.create({ message: m, user: { id: currentUserId } as User }));
        if (toCreate.length) await this.readRepo.save(toCreate);

        return { count: toCreate.length };
    }

    async editMessage(currentUserId: string, messageId: string, text: string) {
        const msg = await this.msgRepo.findOne({ where: { id: messageId } });
        if (!msg) throw new NotFoundException('Message not found');
        if (msg.sender.id !== currentUserId) throw new ForbiddenException('Only sender can edit');

        msg.text = text;
        msg.edited = true;
        return this.msgRepo.save(msg);
    }

    async deleteMessage(currentUserId: string, messageId: string) {
        const msg = await this.msgRepo.findOne({ where: { id: messageId } });
        if (!msg) throw new NotFoundException('Message not found');
        const isOwner = msg.sender.id === currentUserId;
        if (!isOwner) throw new ForbiddenException('Only sender can delete');
        await this.msgRepo.delete(messageId);
        return { success: true };
    }
}
