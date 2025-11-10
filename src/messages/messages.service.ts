import {
    Injectable, BadRequestException, ForbiddenException, NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, In, LessThan, MoreThan, Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Message, MessageType } from './message.entity';
import { MessageAttachment } from './messageAttachment.entity';
import { MessageRead } from './messageRead.entity';
import { MessageKindEnum, SendMessageDto } from './dto/send-message.dto';
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

    // userId → last accepted ms
    private liveThrottle = new Map<string, number>();

    acceptLocationUpdate(userId: string, windowMs = 5000): boolean {
        const now = Date.now();
        const last = this.liveThrottle.get(userId) ?? 0;
        if (now - last >= windowMs) {
            this.liveThrottle.set(userId, now);
            return true;
        }
        return false;
    }

    private async assertMember(userId: string, groupId: string): Promise<{ group: Group; user: User }> {
        const group = await this.groupRepo.findOne({ where: { id: groupId }, relations: ['members', 'owner'] });
        if (!group) throw new NotFoundException('Group not found');
        const user = await this.userRepo.findOne({ where: { sub: userId } });
        if (!user) throw new NotFoundException('User not found');

        const isMember = group.members.some(m => m.sub === userId) || group.owner.sub === userId;
        if (!isMember) throw new ForbiddenException('Not a member of this group');
        return { group, user };
    }

    async sendMessage(currentUserId: string, groupId: string, dto: SendMessageDto): Promise<any> {
        try {
            const { group, user } = await this.assertMember(currentUserId, groupId);
            const attachments: MessageAttachment[] = [];
            // Validate by type
            switch (dto.kind) {
                case MessageKindEnum.TEXT: {
                    console.log("Text Message", dto)
                    const hasText = !!dto.text && dto.text.trim().length > 0;
                    const hasAtts = !!dto.attachments && dto.attachments.length > 0;
                    if (!hasText && !hasAtts) {
                        throw new BadRequestException('Text message must have text or attachments');
                    }
                    break;
                }
                case MessageKindEnum.IMAGE: {
                    if (!dto.attachments?.length) {
                        throw new BadRequestException('Image message must include at least one attachment');
                    }
                    for (const a of dto.attachments) {
                        if (a.mime && !a.mime.startsWith('image/')) {
                            throw new BadRequestException('Invalid image mime');
                        }
                        const attachment = this.attRepo.create({
                            url: a.url,
                            mime: a.mime,
                            contentType: a.mime,
                            durationMs: a.durationMs,
                            width: a.width,
                            height: a.height,
                            sizeBytes: 0,
                            // DO NOT set `message` here; cascade will do it when saving the Message
                        });
                        attachments.push(attachment);
                    }
                    break;
                }
                case MessageKindEnum.LOCATION: {
                    const loc = dto.location;
                    if (!loc) throw new BadRequestException('Location payload missing');
                    if (Math.abs(loc.lat) > 90 || Math.abs(loc.lng) > 180) {
                        throw new BadRequestException('Invalid coordinates');
                    }
                    // Optional: clamp accuracy to sane range
                    if (loc.accuracy != null && (loc.accuracy < 0 || loc.accuracy > 5000)) {
                        loc.accuracy = Math.max(0, Math.min(loc.accuracy, 5000));
                    }
                    break;
                }
                case MessageKindEnum.AUDIO: {
                    if (!dto.attachments?.length) {
                        throw new BadRequestException('Audio message must include an attachment');
                    }
                    // validate all
                    for (const a of dto.attachments) {
                        if (a.mime && !a.mime.startsWith('audio/')) {
                            throw new BadRequestException('Invalid audio mime');
                        }
                        const attachment = this.attRepo.create({
                            url: a.url,
                            mime: a.mime,
                            contentType: a.mime,
                            durationMs: a.durationMs,
                            width: a.width,
                            height: a.height,
                            sizeBytes: 0,
                            // DO NOT set `message` here; cascade will do it when saving the Message
                        });
                        attachments.push(attachment);
                    }
                    break;
                }
                default:
                    throw new BadRequestException('Unsupported message type');
            }
            const message = this.msgRepo.create({
                group,
                sender: user,
                type: dto.kind === MessageKindEnum.TEXT ?
                    MessageType.TEXT : dto.kind === MessageKindEnum.LOCATION ? MessageType.LOCATION :
                        dto.kind === MessageKindEnum.IMAGE ? MessageType.IMAGE : MessageType.AUDIO, // ensure this is your enum (TEXT/IMAGE/LOCATION/AUDIO)
                text:
                    dto.kind === MessageKindEnum.TEXT || dto.kind === MessageKindEnum.IMAGE
                        ? dto.text ?? null
                        : null,
                attachments,
                kind: dto.kind,
                location_lat: dto.kind === MessageKindEnum.LOCATION ? dto.location?.lat ?? null : null,
                location_lng: dto.kind === MessageKindEnum.LOCATION ? dto.location?.lng ?? null : null,
                location_accuracy: dto.kind === MessageKindEnum.LOCATION ? dto.location?.accuracy ?? null : null,
            } as DeepPartial<Message>);

            const saved = await this.msgRepo.save(message);
            return saved;
        } catch (e) {
            console.log(e);
        }

    }

    // Cursor pagination (unchanged)
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
            relations: ['sender'], // ensure sender is loaded for client mapping
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

        const toCreate = msgs
            .filter(m => !existingPairs.has(m.id))
            .map(m => this.readRepo.create({ message: m, user: { id: currentUserId } as User }));
        if (toCreate.length) await this.readRepo.save(toCreate);

        return { count: toCreate.length };
    }

    async editMessage(currentUserId: string, messageId: string, text: string) {
        const msg = await this.msgRepo.findOne({ where: { id: messageId } });
        if (!msg) throw new NotFoundException('Message not found');
        if (msg.sender.id !== currentUserId) throw new ForbiddenException('Only sender can edit');

        msg.text = text;
        (msg as any).edited = true;
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
