import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NGO } from 'src/ngo/ngo.entity';
import { NgoMessage } from 'src/ngo-chat/ngo-message.entity';
import { NgoChatModule } from 'src/ngo-chat/ngo-chat.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { User } from 'src/users/user.entity';
import { CommunityStory } from './community-story.entity';
import { DonationCampaign } from './donation-campaign.entity';
import { DonationNetworkController } from './donation-network.controller';
import { DonationNetworkService } from './donation-network.service';
import { DonationTransaction } from './donation-transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      NGO,
      NgoMessage,
      DonationCampaign,
      DonationTransaction,
      CommunityStory,
    ]),
    NgoChatModule,
    NotificationsModule,
  ],
  controllers: [DonationNetworkController],
  providers: [DonationNetworkService],
  exports: [DonationNetworkService],
})
export class DonationNetworkModule { }
