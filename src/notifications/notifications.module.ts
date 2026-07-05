import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/user.entity';
import { UsersModule } from 'src/users/users.module';
import { Notification } from './notification.entity';
import { NotificationPreference } from './notification-preference.entity';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { PushToken } from './push-token.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([PushToken, NotificationPreference, Notification, User]),
        UsersModule,
    ],
    controllers: [NotificationsController],
    providers: [NotificationsService],
    exports: [NotificationsService],
})
export class NotificationsModule { }
