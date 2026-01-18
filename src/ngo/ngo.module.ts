import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NGO } from './ngo.entity';
import { NgoService } from './ngo.service';
import { NgoController } from './ngo.controller';
import { NgoInventory } from './ngo-inventory.entity';

@Module({
  imports: [TypeOrmModule.forFeature([NGO, NgoInventory])],
  controllers: [NgoController],
  providers: [NgoService],
  exports: [NgoService], // Exported so RescueModule can use it later
})
export class NgoModule {}