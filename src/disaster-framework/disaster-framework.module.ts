import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/user.entity';
import { DisasterFrameworkController } from './disaster-framework.controller';
import { DisasterFrameworkService } from './disaster-framework.service';
import { DisasterIncident } from './disaster-incident.entity';
import { IncidentTimelineEvent } from './incident-timeline.entity';
import { LiveCommunication } from './live-communication.entity';
import { OperationalTask } from './operational-task.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      DisasterIncident,
      LiveCommunication,
      OperationalTask,
      IncidentTimelineEvent,
    ]),
  ],
  controllers: [DisasterFrameworkController],
  providers: [DisasterFrameworkService],
  exports: [DisasterFrameworkService],
})
export class DisasterFrameworkModule { }
