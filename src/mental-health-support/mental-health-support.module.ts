import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/user.entity';
import { MentalHealthJournalEntry } from './journal-entry.entity';
import { MentalHealthNgo } from './mental-health-ngo.entity';
import { MentalHealthProfessional } from './mental-health-professional.entity';
import { MentalHealthSupportController } from './mental-health-support.controller';
import { MentalHealthSupportService } from './mental-health-support.service';
import { MentalHealthSessionRequest } from './session-request.entity';
import { SelfHelpResource } from './self-help-resource.entity';
import { StressTip } from './stress-tip.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      MentalHealthProfessional,
      MentalHealthSessionRequest,
      SelfHelpResource,
      MentalHealthNgo,
      StressTip,
      MentalHealthJournalEntry,
    ]),
  ],
  controllers: [MentalHealthSupportController],
  providers: [MentalHealthSupportService],
  exports: [MentalHealthSupportService],
})
export class MentalHealthSupportModule { }
