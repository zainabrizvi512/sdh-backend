import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RiskAssessment } from './risk/risk-assessment.entity';
import { RiskSignal } from './risk/risk-signal.entity';
import { RiskService } from './risk/risk.service';
import { RiskController } from './risk/risk.controller';
import { DecisionsService } from './decisions/decisions.service';
import { DecisionsController } from './decisions/decisions.controller';
import { DashboardService } from './dashboard/dashboard.service';
import { DashboardController } from './dashboard/dashboard.controller';
import { DisasterType } from 'src/safety/disaster-type.entity';
import { MessagesModule } from 'src/messages/messages.module';

@Module({
  imports: [TypeOrmModule.forFeature([RiskAssessment, RiskSignal, DisasterType]), forwardRef(() => MessagesModule)],
  controllers: [RiskController, DecisionsController, DashboardController],
  providers: [RiskService, DecisionsService, DashboardService],
  exports: [],
})
export class PredictiveHubModule {}
