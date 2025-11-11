import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { SafetyService } from './safety.service';
import { CreateDisasterTypeDto } from './dto/create-disaster-type.dto';
import { CreateGuideDto } from './dto/create-guide.dto';
import { UpdateGuideDto } from './dto/update-guide.dto';
import { CreateStepDto } from './dto/create-step.dto';
import { CreateChecklistItemDto } from './dto/create-checklist-item.dto';
import { CreateQuickActionDto } from './dto/create-quick-action.dto';
import { CreateResourceLinkDto } from './dto/create-resource-link.dto';

@Controller('safety')
export class SafetyController {
    constructor(private readonly svc: SafetyService) { }

    // Disaster types
    @Post('disaster-types') createType(@Body() dto: CreateDisasterTypeDto) { return this.svc.createDisasterType(dto); }
    @Get('disaster-types') listTypes() { return this.svc.listDisasterTypes(); }

    // Guides
    @Post('guides') createGuide(@Body() dto: CreateGuideDto) { return this.svc.createGuide(dto as any); }

    @Get('guides')
    listGuides(
        @Query('city') city?: string,
        @Query('province') province?: string,
        @Query('locale') locale?: string,
        @Query('disaster') disasterSlug?: string,
        @Query('q') q?: string,
        @Query('published') published?: string,
    ) {
        return this.svc.listGuides({
            city, province, locale, disasterSlug, q,
            published: published === undefined ? undefined : published === 'true'
        });
    }

    @Get('guides/:id') getGuide(@Param('id') id: string) { return this.svc.getGuide(id); }
    @Patch('guides/:id') updateGuide(@Param('id') id: string, @Body() dto: UpdateGuideDto) { return this.svc.updateGuide(id, dto); }
    @Delete('guides/:id') deleteGuide(@Param('id') id: string) { return this.svc.deleteGuide(id); }

    // Children
    @Post('steps') addStep(@Body() dto: CreateStepDto) { return this.svc.addStep(dto as any); }
    @Post('checklist') addChecklist(@Body() dto: CreateChecklistItemDto) { return this.svc.addChecklistItem(dto as any); }
    @Post('actions') addAction(@Body() dto: CreateQuickActionDto) { return this.svc.addAction(dto as any); }
    @Post('resources') addResource(@Body() dto: CreateResourceLinkDto) { return this.svc.addResource(dto as any); }
}
