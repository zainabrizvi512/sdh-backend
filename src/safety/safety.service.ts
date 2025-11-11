import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { ChecklistItem } from './checklist-item.entity';
import { DisasterType } from './disaster-type.entity';
import { GuideStep } from './guide-step.entity';
import { QuickAction } from './quick-action.entity';
import { ResourceLink } from './resource-link.entity';
import { SafetyGuide } from './safety-guide.entity';
import { CreateGuideDto } from './dto/create-guide.dto';
import { CreateStepDto } from './dto/create-step.dto';
import { CreateChecklistItemDto } from './dto/create-checklist-item.dto';
import { CreateQuickActionDto } from './dto/create-quick-action.dto';
import { CreateResourceLinkDto } from './dto/create-resource-link.dto';

@Injectable()
export class SafetyService {
    constructor(
        @InjectRepository(DisasterType) private dtRepo: Repository<DisasterType>,
        @InjectRepository(SafetyGuide) private guideRepo: Repository<SafetyGuide>,
        @InjectRepository(GuideStep) private stepRepo: Repository<GuideStep>,
        @InjectRepository(ChecklistItem) private checklistRepo: Repository<ChecklistItem>,
        @InjectRepository(QuickAction) private actionRepo: Repository<QuickAction>,
        @InjectRepository(ResourceLink) private resRepo: Repository<ResourceLink>,
    ) { }

    // --- Disaster Types ---
    createDisasterType(data: Partial<DisasterType>) { return this.dtRepo.save(this.dtRepo.create(data)); }
    listDisasterTypes() { return this.dtRepo.find({ order: { name: 'ASC' } }); }

    // --- Guides ---
    async createGuide(data: CreateGuideDto) {
        const disasterType = await this.dtRepo.findOne({ where: { id: data.disasterTypeId } });
        if (!disasterType) throw new NotFoundException('DisasterType not found');

        const guide = this.guideRepo.create({
            title: data.title,
            locale: data.locale,
            regionCity: data.regionCity,
            regionProvince: data.regionProvince,
            published: data.published ?? false,
            disasterType,
        });

        return this.guideRepo.save(guide);
    }

    async listGuides(params: { city?: string; province?: string; locale?: string; disasterSlug?: string; q?: string; published?: boolean }) {
        const { city, province, locale, disasterSlug, q, published } = params;
        const where: any = {};
        if (city) where.regionCity = city;
        if (province) where.regionProvince = province;
        if (locale) where.locale = locale;
        if (typeof published === 'boolean') where.published = published;

        if (disasterSlug) {
            const dt = await this.dtRepo.findOne({ where: { slug: disasterSlug } });
            if (!dt) return [];
            where.disasterType = dt;
        }
        if (q) {
            where.title = ILike(`%${q}%`);
        }
        return this.guideRepo.find({
            where,
            order: { updatedAt: 'DESC' },
            relations: { steps: true, checklist: true, actions: true, resources: true },
        });
    }

    async getGuide(id: string) {
        const g = await this.guideRepo.findOne({
            where: { id },
            relations: { steps: true, checklist: true, actions: true, resources: true },
        });
        if (!g) throw new NotFoundException('Guide not found');
        // sort children for consistent UX
        g.steps?.sort((a, b) => a.phase.localeCompare(b.phase) || a.order - b.order);
        g.checklist?.sort((a, b) => a.order - b.order);
        g.actions?.sort((a, b) => a.order - b.order);
        g.resources?.sort((a, b) => a.order - b.order);
        return g;
    }

    async updateGuide(id: string, patch: Partial<SafetyGuide>) {
        const g = await this.getGuide(id);
        Object.assign(g, patch);
        return this.guideRepo.save(g);
    }

    async deleteGuide(id: string) {
        const g = await this.getGuide(id);
        await this.guideRepo.remove(g);
    }

    // --- Children (steps, checklist, actions, resources) ---
    async addStep(data: CreateStepDto) {
        const guide = await this.getGuide(data.guideId);
        const step = this.stepRepo.create({
            guide,
            phase: data.phase,
            order: data.order,
            title: data.title,
            body: data.body,
            icon: data.icon,
        });
        return this.stepRepo.save(step);
    }
    async addChecklistItem(data: CreateChecklistItemDto) {
        const guide = await this.getGuide(data.guideId);
        const item = this.checklistRepo.create({
            guide,
            order: data.order,
            label: data.label,
            recommended: data.recommended ?? false,
        });
        return this.checklistRepo.save(item);
    }

    async addAction(data: CreateQuickActionDto) {
        const guide = await this.getGuide(data.guideId);
        const action = this.actionRepo.create({
            guide,
            order: data.order,
            type: data.type,
            label: data.label,
            payload: data.payload,
            icon: data.icon,
        });
        return this.actionRepo.save(action);
    }

    async addResource(data: CreateResourceLinkDto) {
        const guide = await this.getGuide(data.guideId);
        const resource = this.resRepo.create({
            guide,
            order: data.order,
            title: data.title,
            url: data.url,
            source: data.source,
        });
        return this.resRepo.save(resource);
    }
}
