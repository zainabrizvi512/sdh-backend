import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SafetyService } from './safety.service';
import { SafetyController } from './safety.controller';
import { ChecklistItem } from './checklist-item.entity';
import { DisasterType } from './disaster-type.entity';
import { GuideStep } from './guide-step.entity';
import { QuickAction } from './quick-action.entity';
import { ResourceLink } from './resource-link.entity';
import { SafetyGuide } from './safety-guide.entity';

@Module({
    imports: [TypeOrmModule.forFeature([
        DisasterType, SafetyGuide, GuideStep, ChecklistItem, QuickAction, ResourceLink
    ])],
    providers: [SafetyService],
    controllers: [SafetyController],
    exports: [TypeOrmModule, SafetyService],
})
export class SafetyModule { }
