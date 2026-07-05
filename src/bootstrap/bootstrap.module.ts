import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BootstrapSeedService } from './bootstrap-seed.service';
import { User } from '../users/user.entity';
import { Group } from '../group/group.entity';
import { VolunteerActivity } from 'src/engagement-hub/volunteer-activity.entity';
import { EngagementOpportunity } from 'src/engagement-hub/engagement-opportunity.entity';
import { DonationCampaign } from 'src/donation-network/donation-campaign.entity';
import { DonationTransaction } from 'src/donation-network/donation-transaction.entity';
import { CommunityStory } from 'src/donation-network/community-story.entity';
import { DisasterIncident } from 'src/disaster-framework/disaster-incident.entity';
import { LiveCommunication } from 'src/disaster-framework/live-communication.entity';
import { OperationalTask } from 'src/disaster-framework/operational-task.entity';
import { IncidentTimelineEvent } from 'src/disaster-framework/incident-timeline.entity';
import { NGO } from 'src/ngo/ngo.entity';
import { MentalHealthProfessional } from 'src/mental-health-support/mental-health-professional.entity';
import { MentalHealthNgo } from 'src/mental-health-support/mental-health-ngo.entity';
import { SelfHelpResource } from 'src/mental-health-support/self-help-resource.entity';
import { StressTip } from 'src/mental-health-support/stress-tip.entity';
import { AccessControlPolicy } from 'src/data-backup-security/access-control-policy.entity';
import { BackupSnapshot } from 'src/data-backup-security/backup-snapshot.entity';
import { RestoreTestLog } from 'src/data-backup-security/restore-test-log.entity';
import { FeedbackSubmission } from 'src/reviews-feedback/feedback-submission.entity';
import { DisasterType } from 'src/safety/disaster-type.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Group,
      NGO,
      DisasterType,
      VolunteerActivity,
      EngagementOpportunity,
      DonationCampaign,
      DonationTransaction,
      CommunityStory,
      DisasterIncident,
      LiveCommunication,
      OperationalTask,
      IncidentTimelineEvent,
      MentalHealthProfessional,
      MentalHealthNgo,
      SelfHelpResource,
      StressTip,
      AccessControlPolicy,
      BackupSnapshot,
      RestoreTestLog,
      FeedbackSubmission,
    ]),
  ],
  providers: [BootstrapSeedService],
})
export class BootstrapModule {}
