import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { dataSourceOptions } from './config/typeorm.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { GroupModule } from './group/group.module';
import { MessagesModule } from './messages/messages.module';
import { NewsModule } from './news/news.module';
import { SafetyModule } from './safety/safety.module';
import { PredictiveHubModule } from './predictive-hub/predictive-hub.module';
import { BootstrapModule } from './bootstrap/bootstrap.module';
import { RescueModule } from './resource-requests/rescue.module';
import { NgoModule } from './ngo/ngo.module';
import { EmergencyModule } from './emergency/emergency.module';
import { NgoChatModule } from './ngo-chat/ngo-chat.module';
import { EngagementHubModule } from './engagement-hub/engagement-hub.module';
import { DonationNetworkModule } from './donation-network/donation-network.module';
import { DisasterFrameworkModule } from './disaster-framework/disaster-framework.module';
import { MentalHealthSupportModule } from './mental-health-support/mental-health-support.module';
import { DataBackupSecurityModule } from './data-backup-security/data-backup-security.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ReviewsFeedbackModule } from './reviews-feedback/reviews-feedback.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(dataSourceOptions),
    AuthModule,
    UsersModule,
    GroupModule,
    MessagesModule,
    NewsModule,
    SafetyModule,
    PredictiveHubModule,
    RescueModule,
    NgoModule,
    EmergencyModule,
    NgoChatModule,
    EngagementHubModule,
    DonationNetworkModule,
    DisasterFrameworkModule,
    MentalHealthSupportModule,
    DataBackupSecurityModule,
    NotificationsModule,
    ReviewsFeedbackModule,
    BootstrapModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
