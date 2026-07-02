import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/user.entity';
import { Repository } from 'typeorm';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';
import { RequestSessionDto } from './dto/request-session.dto';
import { MentalHealthJournalEntry } from './journal-entry.entity';
import { MentalHealthNgo } from './mental-health-ngo.entity';
import { MentalHealthProfessional } from './mental-health-professional.entity';
import { MentalHealthSessionRequest, SessionRequestStatus } from './session-request.entity';
import { SelfHelpResource, SelfHelpResourceType } from './self-help-resource.entity';
import { StressTip } from './stress-tip.entity';

@Injectable()
export class MentalHealthSupportService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(MentalHealthProfessional)
    private readonly professionalsRepo: Repository<MentalHealthProfessional>,
    @InjectRepository(MentalHealthSessionRequest)
    private readonly sessionsRepo: Repository<MentalHealthSessionRequest>,
    @InjectRepository(SelfHelpResource)
    private readonly resourcesRepo: Repository<SelfHelpResource>,
    @InjectRepository(MentalHealthNgo)
    private readonly ngosRepo: Repository<MentalHealthNgo>,
    @InjectRepository(StressTip)
    private readonly tipsRepo: Repository<StressTip>,
    @InjectRepository(MentalHealthJournalEntry)
    private readonly journalRepo: Repository<MentalHealthJournalEntry>,
  ) { }

  private async getUserBySub(sub: string): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { sub } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async listProfessionals() {
    const professionals = await this.professionalsRepo.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });

    return {
      professionals: professionals.map((p) => ({
        id: p.id,
        name: p.name,
        specialty: p.specialty,
        sessionType: p.sessionType,
        availabilityLabel: p.availabilityLabel,
        availabilityDisplay: `${p.sessionType === 'VIDEO' ? 'Video' : 'Voice'} / ${p.availabilityLabel}`,
      })),
    };
  }

  async requestSession(sub: string, dto: RequestSessionDto) {
    if (!dto.professionalId?.trim()) throw new BadRequestException('professionalId is required');

    const user = await this.getUserBySub(sub);
    const professional = await this.professionalsRepo.findOne({
      where: { id: dto.professionalId, isActive: true },
    });
    if (!professional) throw new NotFoundException('Professional not found');

    const request = this.sessionsRepo.create({
      user,
      professional,
      status: SessionRequestStatus.REQUESTED,
      notes: dto.notes?.trim(),
    });

    const saved = await this.sessionsRepo.save(request);
    return {
      id: saved.id,
      status: saved.status,
      professional: {
        id: professional.id,
        name: professional.name,
        specialty: professional.specialty,
      },
      createdAt: saved.createdAt,
    };
  }

  async getMySessions(sub: string) {
    const user = await this.getUserBySub(sub);
    const sessions = await this.sessionsRepo.find({
      where: { user: { id: user.id } },
      relations: ['professional'],
      order: { createdAt: 'DESC' },
    });

    return {
      sessions: sessions.map((s) => ({
        id: s.id,
        status: s.status,
        notes: s.notes ?? null,
        professional: {
          id: s.professional.id,
          name: s.professional.name,
          specialty: s.professional.specialty,
          sessionType: s.professional.sessionType,
        },
        createdAt: s.createdAt,
      })),
    };
  }

  async listSelfHelpResources(type?: SelfHelpResourceType) {
    const where: { isActive: boolean; type?: SelfHelpResourceType } = { isActive: true };
    if (type) where.type = type;

    const resources = await this.resourcesRepo.find({
      where,
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });

    return {
      resources: resources.map((r) => ({
        id: r.id,
        type: r.type,
        title: r.title,
        body: r.body ?? null,
        contentUrl: r.contentUrl ?? null,
        durationMinutes: r.durationMinutes ?? null,
      })),
    };
  }

  async createJournalEntry(sub: string, dto: CreateJournalEntryDto) {
    if (!dto.content?.trim()) throw new BadRequestException('content is required');

    const user = await this.getUserBySub(sub);
    const entry = this.journalRepo.create({
      user,
      prompt: dto.prompt?.trim(),
      content: dto.content.trim(),
    });

    const saved = await this.journalRepo.save(entry);
    return {
      id: saved.id,
      prompt: saved.prompt ?? null,
      content: saved.content,
      createdAt: saved.createdAt,
    };
  }

  async listNgos() {
    const ngos = await this.ngosRepo.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });

    return {
      ngos: ngos.map((n) => ({
        id: n.id,
        name: n.name,
        description: n.description,
        helpline: n.helpline ?? null,
        websiteUrl: n.websiteUrl ?? null,
      })),
    };
  }

  async listStressTips() {
    const tips = await this.tipsRepo.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });

    return {
      tips: tips.map((t) => ({
        id: t.id,
        title: t.title,
        body: t.body ?? null,
      })),
    };
  }
}
