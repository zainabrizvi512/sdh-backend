import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmergencyController } from './emergency.controller';
import { EmergencyService } from './emergency.service';
import { RiskSignal } from 'src/predictive-hub/risk/risk-signal.entity';
import { ResourceRequest } from 'src/resource-requests/resource_request.entity';
import { NgoInventory } from 'src/ngo/ngo-inventory.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RiskSignal,
      ResourceRequest,
      NgoInventory
    ])
  ],
  controllers: [EmergencyController],
  providers: [EmergencyService],
})
export class EmergencyModule {}