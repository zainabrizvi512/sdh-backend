import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { User } from 'src/users/user.entity';
import { UsersService } from 'src/users/users.service';
import { In, Repository } from 'typeorm';
import { RegisterTokenDto } from './dto/register-token.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { Notification } from './notification.entity';
import { NotificationPreference } from './notification-preference.entity';
import { PushToken } from './push-token.entity';

export type PreferenceKey =
    | 'emergencyAlerts'
    | 'news'
    | 'chatMessages'
    | 'donationUpdates';

export type PushPayload = {
    title: string;
    body: string;
    data?: Record<string, unknown>;
};

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);
    private readonly expo = new Expo();

    constructor(
        @InjectRepository(PushToken)
        private readonly tokenRepo: Repository<PushToken>,
        @InjectRepository(NotificationPreference)
        private readonly prefRepo: Repository<NotificationPreference>,
        @InjectRepository(Notification)
        private readonly notificationsRepo: Repository<Notification>,
        @InjectRepository(User)
        private readonly usersRepo: Repository<User>,
        private readonly usersService: UsersService,
    ) { }

    private async resolveUser(sub: string) {
        const user = await this.usersService.findBySub(sub);
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    async registerToken(sub: string, dto: RegisterTokenDto) {
        const user = await this.resolveUser(sub);

        const existing = await this.tokenRepo.findOne({ where: { token: dto.token } });
        if (existing) {
            existing.user = user;
            existing.platform = dto.platform;
            return this.tokenRepo.save(existing);
        }

        const created = this.tokenRepo.create({
            user,
            token: dto.token,
            platform: dto.platform,
        });
        return this.tokenRepo.save(created);
    }

    async unregisterToken(sub: string, token: string) {
        const user = await this.resolveUser(sub);
        await this.tokenRepo.delete({ token, user: { id: user.id } });
        return { success: true };
    }

    async getPreferences(sub: string) {
        const user = await this.resolveUser(sub);
        const existing = await this.prefRepo.findOne({ where: { user: { id: user.id } } });
        if (existing) return existing;

        const created = this.prefRepo.create({ user });
        return this.prefRepo.save(created);
    }

    async updatePreferences(sub: string, dto: UpdatePreferencesDto) {
        const existing = await this.getPreferences(sub);
        Object.assign(existing, dto);
        return this.prefRepo.save(existing);
    }

    private async sendExpoPush(tokens: string[], payload: PushPayload) {
        const messages: ExpoPushMessage[] = tokens
            .filter((t) => Expo.isExpoPushToken(t))
            .map((to) => ({
                to,
                sound: 'default' as const,
                title: payload.title,
                body: payload.body,
                data: payload.data ?? {},
            }));

        if (!messages.length) return;

        const chunks = this.expo.chunkPushNotifications(messages);
        for (const chunk of chunks) {
            try {
                await this.expo.sendPushNotificationsAsync(chunk);
            } catch (err) {
                this.logger.error('Failed to send Expo push chunk', err as Error);
            }
        }
    }

    private async persistForUsers(userIds: string[], type: string, payload: PushPayload) {
        if (!userIds.length) return;
        const rows = userIds.map((id) =>
            this.notificationsRepo.create({
                user: { id } as User,
                type,
                title: payload.title,
                body: payload.body,
                data: payload.data,
                read: false,
            }),
        );
        await this.notificationsRepo.save(rows);
    }

    async sendToUser(userId: string, payload: PushPayload, type: string = 'general') {
        await this.persistForUsers([userId], type, payload);
        const tokens = await this.tokenRepo.find({ where: { user: { id: userId } } });
        await this.sendExpoPush(tokens.map((t) => t.token), payload);
    }

    /** Sends to every user who has the given preference enabled (defaulting to enabled if they have no row yet). */
    async broadcastByPreference(prefKey: PreferenceKey, payload: PushPayload) {
        const optedOutUserIds = (
            await this.prefRepo.find({ where: { [prefKey]: false } as any, relations: ['user'] })
        ).map((p) => p.user.id);

        const usersQb = this.usersRepo.createQueryBuilder('u').select('u.id', 'id');
        if (optedOutUserIds.length) {
            usersQb.where('u.id NOT IN (:...ids)', { ids: optedOutUserIds });
        }
        const targetUserIds = (await usersQb.getRawMany<{ id: string }>()).map((u) => u.id);
        if (!targetUserIds.length) return;

        await this.persistForUsers(targetUserIds, prefKey, payload);

        const rows = await this.tokenRepo
            .createQueryBuilder('pt')
            .select('pt.token', 'token')
            .where('pt.userId IN (:...ids)', { ids: targetUserIds })
            .getRawMany<{ token: string }>();
        await this.sendExpoPush(rows.map((r) => r.token), payload);
    }

    /** Sends to a specific set of users (e.g. a chat group), honoring their preference for prefKey. */
    async notifyUsers(userIds: string[], prefKey: PreferenceKey, payload: PushPayload) {
        const uniqueIds = Array.from(new Set(userIds));
        if (!uniqueIds.length) return;

        const optedOut = await this.prefRepo.find({
            where: { user: { id: In(uniqueIds) }, [prefKey]: false } as any,
            relations: ['user'],
        });
        const optedOutIds = new Set(optedOut.map((p) => p.user.id));
        const targetIds = uniqueIds.filter((id) => !optedOutIds.has(id));
        if (!targetIds.length) return;

        await this.persistForUsers(targetIds, prefKey, payload);

        const rows = await this.tokenRepo
            .createQueryBuilder('pt')
            .select('pt.token', 'token')
            .where('pt.userId IN (:...ids)', { ids: targetIds })
            .getRawMany<{ token: string }>();
        await this.sendExpoPush(rows.map((r) => r.token), payload);
    }

    async listForUser(sub: string, unreadOnly?: boolean) {
        const user = await this.resolveUser(sub);
        return this.notificationsRepo.find({
            where: unreadOnly ? { user: { id: user.id }, read: false } : { user: { id: user.id } },
            order: { createdAt: 'DESC' },
            take: 100,
        });
    }

    async getUnreadCount(sub: string) {
        const user = await this.resolveUser(sub);
        const count = await this.notificationsRepo.count({
            where: { user: { id: user.id }, read: false },
        });
        return { count };
    }

    async markRead(sub: string, id: string) {
        const user = await this.resolveUser(sub);
        const notification = await this.notificationsRepo.findOne({
            where: { id, user: { id: user.id } },
        });
        if (!notification) throw new NotFoundException('Notification not found');
        notification.read = true;
        return this.notificationsRepo.save(notification);
    }

    async markAllRead(sub: string) {
        const user = await this.resolveUser(sub);
        await this.notificationsRepo.update({ user: { id: user.id }, read: false }, { read: true });
        return { success: true };
    }
}
