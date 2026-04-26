import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RescueService } from './rescue.service';
import { RescueController } from './rescue.controller';
import { ResourceRequest } from './resource_request.entity';
import { ResourceAllocation } from './resource_allocation.entity';
import { FieldReport } from './field_report.entity';
import { User } from 'src/users/user.entity';
import { NGO } from 'src/ngo/ngo.entity';

@Module({
  imports: [
    // Register the new entities so TypeORM can inject their repositories
    TypeOrmModule.forFeature([
      ResourceRequest,
      ResourceAllocation,
      FieldReport,
      User,
      NGO
    ]),
  ],
  controllers: [RescueController],
  providers: [RescueService],
  exports: [RescueService], // Export if you need to access RescueService from other modules (e.g., Notifications)
})
export class RescueModule {}