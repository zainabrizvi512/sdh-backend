// src/predictive-hub/reports/reports.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RiskSignal } from '../risk/risk-signal.entity';
import { RiskService } from '../risk/risk.service';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { MessagesModule } from 'src/messages/messages.module';
import { Message } from 'src/messages/message.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([RiskSignal, Message]),
    forwardRef(() => MessagesModule),
  ],
  providers: [ReportsService, RiskService],
  controllers: [ReportsController],
})
export class ReportsModule {}
