import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/user.entity';
import { EngagementHubController } from './engagement-hub.controller';
import { EngagementHubService } from './engagement-hub.service';
import { VolunteerActivity } from './volunteer-activity.entity';
import { EngagementOpportunity } from './engagement-opportunity.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, VolunteerActivity, EngagementOpportunity])],
  controllers: [EngagementHubController],
  providers: [EngagementHubService],
  exports: [EngagementHubService],
})
export class EngagementHubModule { }
