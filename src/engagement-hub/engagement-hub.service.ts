import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/users/user.entity';
import { EngagementOpportunity, OpportunityStatus } from './engagement-opportunity.entity';
import { VolunteerActivity, VolunteerActivityStatus } from './volunteer-activity.entity';
import { CreateVolunteerActivityDto } from './dto/create-volunteer-activity.dto';
import { UpdateVolunteerActivityStatusDto } from './dto/update-volunteer-activity-status.dto';
import { CreateOpportunityDto } from './dto/create-opportunity.dto';

@Injectable()
export class EngagementHubService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(VolunteerActivity)
    private readonly activitiesRepo: Repository<VolunteerActivity>,
    @InjectRepository(EngagementOpportunity)
    private readonly opportunitiesRepo: Repository<EngagementOpportunity>,
  ) { }

  private async getUserBySub(sub: string): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { sub } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  private toNumber(value: unknown): number | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return undefined;
    return parsed;
  }

  private haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const earthRadiusKm = 6371;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadiusKm * c;
  }

  async getDashboard(sub: string) {
    const user = await this.getUserBySub(sub);

    const aggregate = await this.activitiesRepo
      .createQueryBuilder('a')
      .select([
        `COALESCE(SUM(CASE WHEN a.status = 'COMPLETED' THEN a.xpReward ELSE 0 END), 0) as "totalXp"`,
        `COALESCE(SUM(CASE WHEN a.status = 'COMPLETED' THEN a.livesImpacted ELSE 0 END), 0) as "livesImpacted"`,
        `COALESCE(SUM(CASE WHEN a.status = 'IN_PROGRESS' THEN 1 ELSE 0 END), 0) as "missionsInProgress"`,
      ])
      .where('a.volunteerId = :userId', { userId: user.id })
      .getRawOne();

    const totalXp = Number(aggregate?.totalXp ?? 0);
    const livesImpacted = Number(aggregate?.livesImpacted ?? 0);
    const missionsInProgress = Number(aggregate?.missionsInProgress ?? 0);

    const xpPerLevel = 75;
    const level = Math.max(1, Math.floor(totalXp / xpPerLevel) + 1);
    const currentLevelXp = (level - 1) * xpPerLevel;
    const nextLevelXp = level * xpPerLevel;

    return {
      user: {
        id: user.id,
        name: user.name ?? user.username ?? user.email,
        rank: this.deriveRank(level),
        picture: user.picture ?? null,
      },
      stats: {
        totalXp,
        level,
        currentLevelXp,
        nextLevelXp,
        missionsInProgress,
        livesImpacted,
      },
    };
  }

  private deriveRank(level: number): string {
    if (level >= 20) return 'DISASTER RESPONSE COMMANDER';
    if (level >= 14) return 'EMERGENCY ELITE';
    if (level >= 8) return 'CRISIS RESPONDER';
    return 'RESCUE VOLUNTEER';
  }

  async createActivity(sub: string, dto: CreateVolunteerActivityDto) {
    if (!dto.title?.trim()) throw new BadRequestException('title is required');
    const user = await this.getUserBySub(sub);

    const activity = this.activitiesRepo.create({
      volunteer: user,
      title: dto.title.trim(),
      category: dto.category?.trim() || 'GENERAL',
      status: dto.status ?? VolunteerActivityStatus.AVAILABLE,
      xpReward: dto.xpReward ?? 100,
      livesImpacted: dto.livesImpacted ?? 0,
      startsAt: dto.startsAt ? new Date(dto.startsAt) : new Date(),
      latitude: this.toNumber(dto.latitude),
      longitude: this.toNumber(dto.longitude),
      city: dto.city?.trim(),
      metadata: dto.metadata,
    });

    return this.activitiesRepo.save(activity);
  }

  async listActivities(sub: string, status?: VolunteerActivityStatus) {
    const user = await this.getUserBySub(sub);

    const qb = this.activitiesRepo
      .createQueryBuilder('a')
      .where('a.volunteerId = :userId', { userId: user.id })
      .orderBy('a.createdAt', 'DESC');

    if (status) qb.andWhere('a.status = :status', { status });

    const activities = await qb.getMany();
    return activities.map((activity) => ({
      id: activity.id,
      title: activity.title,
      category: activity.category,
      status: activity.status,
      xpReward: activity.xpReward,
      livesImpacted: activity.livesImpacted,
      startsAt: activity.startsAt,
      completedAt: activity.completedAt,
      city: activity.city ?? null,
    }));
  }

  async updateActivityStatus(sub: string, activityId: string, dto: UpdateVolunteerActivityStatusDto) {
    const user = await this.getUserBySub(sub);
    const activity = await this.activitiesRepo.findOne({
      where: { id: activityId, volunteer: { id: user.id } },
      relations: ['volunteer'],
    });

    if (!activity) throw new NotFoundException('Activity not found');
    if (!dto.status) throw new BadRequestException('status is required');

    activity.status = dto.status;
    if (dto.livesImpacted !== undefined) activity.livesImpacted = dto.livesImpacted;
    if (dto.status === VolunteerActivityStatus.COMPLETED && !activity.completedAt) {
      activity.completedAt = new Date();
    }

    return this.activitiesRepo.save(activity);
  }

  async getHistory(sub: string) {
    const user = await this.getUserBySub(sub);
    const history = await this.activitiesRepo.find({
      where: { volunteer: { id: user.id }, status: VolunteerActivityStatus.COMPLETED },
      order: { completedAt: 'DESC', createdAt: 'DESC' },
    });

    return {
      completedOperations: history.map((activity) => ({
        id: activity.id,
        title: activity.title,
        completedAt: activity.completedAt ?? activity.updatedAt,
        xpEarned: activity.xpReward,
        livesImpacted: activity.livesImpacted,
      })),
    };
  }

  async createOpportunity(dto: CreateOpportunityDto) {
    if (!dto.title?.trim()) throw new BadRequestException('title is required');
    if (dto.latitude === undefined || dto.longitude === undefined) {
      throw new BadRequestException('latitude and longitude are required');
    }

    const opportunity = this.opportunitiesRepo.create({
      title: dto.title.trim(),
      description: dto.description?.trim(),
      city: dto.city?.trim(),
      latitude: dto.latitude,
      longitude: dto.longitude,
      radiusKm: dto.radiusKm ?? 5,
      xpReward: dto.xpReward ?? 120,
      status: OpportunityStatus.OPEN,
      startsAt: dto.startsAt ? new Date(dto.startsAt) : new Date(),
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
    });

    return this.opportunitiesRepo.save(opportunity);
  }

  async getGeoOpportunities(sub: string, latitude?: number, longitude?: number, radiusKm?: number) {
    const user = await this.getUserBySub(sub);
    const userLat = latitude ?? this.toNumber(user.latitude);
    const userLon = longitude ?? this.toNumber(user.longitude);

    const searchRadius = radiusKm ?? 5;
    const now = new Date();
    const opportunities = await this.opportunitiesRepo.find({
      where: { status: OpportunityStatus.OPEN },
      order: { createdAt: 'DESC' },
    });

    if (userLat === undefined || userLon === undefined) {
      return {
        message: 'Location unavailable. Please update location to get nearby opportunities.',
        opportunities: [],
      };
    }

    return {
      opportunities: opportunities
        .map((opportunity) => {
          const distanceKm = this.haversineDistanceKm(
            userLat,
            userLon,
            Number(opportunity.latitude),
            Number(opportunity.longitude),
          );

          return {
            id: opportunity.id,
            title: opportunity.title,
            description: opportunity.description ?? null,
            city: opportunity.city ?? null,
            xpReward: opportunity.xpReward,
            distanceKm: Number(distanceKm.toFixed(2)),
            radiusKm: opportunity.radiusKm,
            startsAt: opportunity.startsAt ?? null,
            expiresAt: opportunity.expiresAt ?? null,
            isActive:
              (!opportunity.startsAt || opportunity.startsAt <= now) &&
              (!opportunity.expiresAt || opportunity.expiresAt >= now),
          };
        })
        .filter((opportunity) => opportunity.distanceKm <= searchRadius)
        .sort((a, b) => a.distanceKm - b.distanceKm),
    };
  }
}
