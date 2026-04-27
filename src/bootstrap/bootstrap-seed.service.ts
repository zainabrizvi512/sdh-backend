import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../users/user.entity';
import { Group, GroupType } from '../group/group.entity';
import { VolunteerActivity, VolunteerActivityStatus } from 'src/engagement-hub/volunteer-activity.entity';
import { EngagementOpportunity, OpportunityStatus } from 'src/engagement-hub/engagement-opportunity.entity';
import { DonationCampaign, DonationCampaignStatus } from 'src/donation-network/donation-campaign.entity';
import { DonationTransaction, DonationMethod } from 'src/donation-network/donation-transaction.entity';
import { CommunityStory } from 'src/donation-network/community-story.entity';
import { DisasterIncident, IncidentSeverity, IncidentStatus } from 'src/disaster-framework/disaster-incident.entity';
import { LiveCommunication } from 'src/disaster-framework/live-communication.entity';
import { IncidentTimelineEvent } from 'src/disaster-framework/incident-timeline.entity';
import { OperationalTask, OperationalTaskPriority, OperationalTaskStatus } from 'src/disaster-framework/operational-task.entity';
import { NGO } from 'src/ngo/ngo.entity';

@Injectable()
export class BootstrapSeedService implements OnApplicationBootstrap {
    private readonly logger = new Logger(BootstrapSeedService.name);

    constructor(
        @InjectRepository(User) private readonly usersRepo: Repository<User>,
        @InjectRepository(Group) private readonly groupsRepo: Repository<Group>,
        @InjectRepository(NGO) private readonly ngoRepo: Repository<NGO>,
        @InjectRepository(VolunteerActivity) private readonly activitiesRepo: Repository<VolunteerActivity>,
        @InjectRepository(EngagementOpportunity) private readonly opportunitiesRepo: Repository<EngagementOpportunity>,
        @InjectRepository(DonationCampaign) private readonly campaignsRepo: Repository<DonationCampaign>,
        @InjectRepository(DonationTransaction) private readonly donationsRepo: Repository<DonationTransaction>,
        @InjectRepository(CommunityStory) private readonly storiesRepo: Repository<CommunityStory>,
        @InjectRepository(DisasterIncident) private readonly incidentsRepo: Repository<DisasterIncident>,
        @InjectRepository(LiveCommunication) private readonly commsRepo: Repository<LiveCommunication>,
        @InjectRepository(OperationalTask) private readonly tasksRepo: Repository<OperationalTask>,
        @InjectRepository(IncidentTimelineEvent) private readonly timelineRepo: Repository<IncidentTimelineEvent>,
    ) {}

    async onApplicationBootstrap() {
        try {
            await this.ensureSystemUserAndGlobalGroup();
            await this.seedEngagementHubData();
            await this.seedDonationNetworkData();
            await this.seedDisasterFrameworkData();
        } catch (err: any) {
            this.logger.error(`Bootstrap seed failed: ${err?.message ?? err}`, err?.stack);
        }
    }

    private async ensureSystemUserAndGlobalGroup() {
        const SYSTEM_SUB = 'sdh-system';
        const SYSTEM_EMAIL = 'system@sdh.local';
        const SYSTEM_NAME = 'SDH System';

        const GLOBAL_GROUP_SLUG = 'global';
        const GLOBAL_GROUP_TYPE = GroupType.EMERGENCY;

        let systemUser = await this.usersRepo.findOne({
            where: { sub: SYSTEM_SUB },
        });

        if (!systemUser) {
            systemUser = await this.usersRepo.save(
                this.usersRepo.create({
                    sub: SYSTEM_SUB,
                    email: SYSTEM_EMAIL,
                    name: SYSTEM_NAME,
                    username: 'sdh-system',
                    connectionType: 'system',
                }),
            );
        }

        let globalGroup = await this.groupsRepo.findOne({
            where: { slug: GLOBAL_GROUP_SLUG } as any,
        });

        if (!globalGroup) {
            await this.groupsRepo.save(
                this.groupsRepo.create({
                    slug: GLOBAL_GROUP_SLUG,
                    name: 'SDH Global',
                    type: GLOBAL_GROUP_TYPE,
                    owner: systemUser,
                    members: [],
                }),
            );
        }
    }

    private async seedEngagementHubData() {
        const existingOpps = await this.opportunitiesRepo.count();
        if (existingOpps === 0) {
            const now = Date.now();
            await this.opportunitiesRepo.save(
                this.opportunitiesRepo.create([
                    {
                        title: 'Local Flood Relief - Sector F7',
                        description: 'Help with food pack distribution and first aid setup.',
                        city: 'Islamabad',
                        latitude: 33.7294,
                        longitude: 73.0931,
                        radiusKm: 5,
                        xpReward: 180,
                        status: OpportunityStatus.OPEN,
                        startsAt: new Date(now - 2 * 60 * 60 * 1000),
                        expiresAt: new Date(now + 24 * 60 * 60 * 1000),
                    },
                ]),
            );
        }

        const users = await this.usersRepo.find({ take: 10 });
        if (!users.length) return;

        for (const user of users) {
            const count = await this.activitiesRepo.count({
                where: { volunteer: { id: user.id } },
            });

            if (count > 0) continue;

            await this.activitiesRepo.save(
                this.activitiesRepo.create([
                    {
                        volunteer: user,
                        title: 'Emergency Kit Distribution',
                        category: 'RELIEF',
                        status: VolunteerActivityStatus.COMPLETED,
                        xpReward: 250,
                        livesImpacted: 120,
                        city: 'Islamabad',
                        startsAt: new Date(),
                        completedAt: new Date(),
                    },
                ]),
            );
        }
    }

    private async seedDonationNetworkData() {
        let campaigns = await this.campaignsRepo.find({ take: 2 });

        if (!campaigns.length) {
            campaigns = await this.campaignsRepo.save(
                this.campaignsRepo.create([
                    {
                        title: 'Flood Relief 2026',
                        causeCategory: 'DISASTER',
                        description: 'Funding shelter kits.',
                        goalAmount: 50000,
                        raisedAmount: 32500,
                        status: DonationCampaignStatus.ACTIVE,
                    },
                ]),
            );
        }

        const storiesCount = await this.storiesRepo.count();
        if (storiesCount === 0) {
            const [author] = await this.usersRepo.find({
                order: { createdAt: 'ASC' },
                take: 1,
            });

            if (author) {
                await this.storiesRepo.save(
                    this.storiesRepo.create([
                        {
                            author,
                            authorDisplayName: 'Sarah M.',
                            content: 'Donations saved lives!',
                        },
                    ]),
                );
            }
        }

        const donationsCount = await this.donationsRepo.count();
        if (donationsCount === 0) {
            const [donor] = await this.usersRepo.find({
                order: { createdAt: 'ASC' },
                take: 1,
            });

            const [ngo] = await this.ngoRepo.find({
                order: { createdAt: 'ASC' },
                take: 1,
            });

            if (donor && campaigns[0]) {
                await this.donationsRepo.save(
                    this.donationsRepo.create({
                        donor,
                        ngo: ngo ?? undefined,
                        campaign: campaigns[0],
                        amount: 150,
                        method: DonationMethod.CARD,
                        currency: 'USD',
                        isSuccessful: true,
                    }),
                );
            }
        }
    }

    private async seedDisasterFrameworkData() {
        let incidents = await this.incidentsRepo.find({ take: 2 });

        if (!incidents.length) {
            incidents = await this.incidentsRepo.save(
                this.incidentsRepo.create([
                    {
                        title: 'Flash Flood Alert',
                        description: 'Water level rising.',
                        sector: 'ISB',
                        severity: IncidentSeverity.CRITICAL,
                        status: IncidentStatus.OPEN,
                        latitude: 33.6844,
                        longitude: 73.0479,
                    },
                ]),
            );
        }

        const commsCount = await this.commsRepo.count();
        if (commsCount === 0) {
            const [sender] = await this.usersRepo.find({
                order: { createdAt: 'ASC' },
                take: 1,
            });

            if (sender) {
                await this.commsRepo.save(
                    this.commsRepo.create({
                        sender,
                        channel: 'SECURE',
                        sector: 'ISB',
                        message: 'System ready',
                    }),
                );
            }
        }
    }
}