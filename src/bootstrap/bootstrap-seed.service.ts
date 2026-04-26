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
        @InjectRepository(User)
        private readonly usersRepo: Repository<User>,

        @InjectRepository(Group)
        private readonly groupsRepo: Repository<Group>,

        @InjectRepository(NGO)
        private readonly ngoRepo: Repository<NGO>,

        @InjectRepository(VolunteerActivity)
        private readonly activitiesRepo: Repository<VolunteerActivity>,

        @InjectRepository(EngagementOpportunity)
        private readonly opportunitiesRepo: Repository<EngagementOpportunity>,

        @InjectRepository(DonationCampaign)
        private readonly campaignsRepo: Repository<DonationCampaign>,

        @InjectRepository(DonationTransaction)
        private readonly donationsRepo: Repository<DonationTransaction>,

        @InjectRepository(CommunityStory)
        private readonly storiesRepo: Repository<CommunityStory>,

        @InjectRepository(DisasterIncident)
        private readonly incidentsRepo: Repository<DisasterIncident>,

        @InjectRepository(LiveCommunication)
        private readonly commsRepo: Repository<LiveCommunication>,

        @InjectRepository(OperationalTask)
        private readonly tasksRepo: Repository<OperationalTask>,

        @InjectRepository(IncidentTimelineEvent)
        private readonly timelineRepo: Repository<IncidentTimelineEvent>,
    ) { }

    async onApplicationBootstrap() {
        // Prevent crashes from killing app start; log instead
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
        // ✅ Choose stable identifiers
        const SYSTEM_SUB = 'sdh-system';           // safest if your User has `sub`
        const SYSTEM_EMAIL = 'system@sdh.local';   // fallback if you prefer email uniqueness
        const SYSTEM_NAME = 'SDH System';

        const GLOBAL_GROUP_SLUG = 'global';
        const GLOBAL_GROUP_NAME = 'SDH Global';
        const GLOBAL_GROUP_TYPE = GroupType.EMERGENCY;

        // ---------------------------
        // 1) Ensure System User
        // ---------------------------
        // Prefer sub if it exists in your User schema; otherwise use email.
        // If your User entity doesn't have `sub`, switch the where clause to { email: SYSTEM_EMAIL }.
        let systemUser: User | null = null;

        systemUser = await this.usersRepo.findOne({
            where: { sub: SYSTEM_SUB },
        });

        if (!systemUser) {
            systemUser = this.usersRepo.create({
                sub: SYSTEM_SUB,
                email: SYSTEM_EMAIL,
                name: SYSTEM_NAME,
                username: 'sdh-system',
                connectionType: 'system', // ✅ required
            });

            systemUser = await this.usersRepo.save(systemUser);
            this.logger.log(`✅ Created System User (id=${systemUser.id})`);
        } else {
            this.logger.log(`ℹ️ System User exists (id=${systemUser.id})`);
        }

        // ---------------------------
        // 2) Ensure Global Group
        // ---------------------------
        let globalGroup: Group | null = null;
        globalGroup = await this.groupsRepo.findOne({
            where: { slug: GLOBAL_GROUP_SLUG } as any,
        });

        if (!globalGroup) {
            globalGroup = this.groupsRepo.create({
                slug: GLOBAL_GROUP_SLUG,
                name: GLOBAL_GROUP_NAME,
                type: GLOBAL_GROUP_TYPE,
                owner: systemUser, // must be User, not null
                members: [],
            });

            globalGroup = await this.groupsRepo.save(globalGroup);

            this.logger.log(
                `✅ Created Global Group (id=${globalGroup.id}, slug=${globalGroup.slug})`,
            );
        } else {
            // Optional: enforce correct type/owner if it already exists but wrong
            let changed = false;

            if (globalGroup.type !== GLOBAL_GROUP_TYPE) {
                globalGroup.type = GLOBAL_GROUP_TYPE;
                changed = true;
            }

            if (!globalGroup.owner) {
                globalGroup.owner = systemUser;
                changed = true;
            }

            if (changed) {
                await this.groupsRepo.save(globalGroup);
                this.logger.log(`✅ Updated Global Group to expected settings (id=${globalGroup.id})`);
            } else {
                this.logger.log(`ℹ️ Global Group exists (id=${globalGroup.id})`);
            }
        }
    }

    private async seedEngagementHubData() {
        const existingOpps = await this.opportunitiesRepo.count();
        if (existingOpps === 0) {
            const now = Date.now();
            const opportunities = this.opportunitiesRepo.create([
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
                {
                    title: 'Medical Support - Blue Area',
                    description: 'Assist triage desk and medicine logistics.',
                    city: 'Islamabad',
                    latitude: 33.7070,
                    longitude: 73.0498,
                    radiusKm: 7,
                    xpReward: 220,
                    status: OpportunityStatus.OPEN,
                    startsAt: new Date(now - 60 * 60 * 1000),
                    expiresAt: new Date(now + 36 * 60 * 60 * 1000),
                },
            ]);
            await this.opportunitiesRepo.save(opportunities);
            this.logger.log(`✅ Seeded ${opportunities.length} engagement opportunities`);
        }

        const users = await this.usersRepo.find({ take: 10, order: { createdAt: 'ASC' } });
        if (!users.length) return;

        for (const user of users) {
            const userActivitiesCount = await this.activitiesRepo.count({
                where: { volunteer: { id: user.id } },
            });

            if (userActivitiesCount > 0) continue;

            const activities = this.activitiesRepo.create([
                {
                    volunteer: user,
                    title: 'Emergency Kit Distribution',
                    category: 'RELIEF',
                    status: VolunteerActivityStatus.COMPLETED,
                    xpReward: 250,
                    livesImpacted: 120,
                    city: 'Islamabad',
                    startsAt: new Date(Date.now() - 72 * 60 * 60 * 1000),
                    completedAt: new Date(Date.now() - 70 * 60 * 60 * 1000),
                },
                {
                    volunteer: user,
                    title: 'Community Awareness Drive',
                    category: 'AWARENESS',
                    status: VolunteerActivityStatus.IN_PROGRESS,
                    xpReward: 140,
                    livesImpacted: 30,
                    city: 'Islamabad',
                    startsAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
                },
            ]);

            await this.activitiesRepo.save(activities);
        }

        this.logger.log('✅ Seeded engagement activities for available users');
    }

    private async seedDonationNetworkData() {
        const campaignsCount = await this.campaignsRepo.count();
        let campaigns: DonationCampaign[] = [];
        if (campaignsCount === 0) {
            campaigns = await this.campaignsRepo.save(
                this.campaignsRepo.create([
                    {
                        title: 'Flood Relief 2026',
                        causeCategory: 'DISASTER',
                        description: 'Funding shelter kits and emergency meals for flood-affected families.',
                        goalAmount: 50000,
                        raisedAmount: 32500,
                        status: DonationCampaignStatus.ACTIVE,
                    },
                    {
                        title: 'Emergency Medical Kits',
                        causeCategory: 'HEALTH',
                        description: 'Supply trauma kits and mobile clinic essentials.',
                        goalAmount: 10000,
                        raisedAmount: 4000,
                        status: DonationCampaignStatus.ACTIVE,
                    },
                ]),
            );
            this.logger.log(`✅ Seeded ${campaigns.length} donation campaigns`);
        } else {
            campaigns = await this.campaignsRepo.find({ take: 2, order: { createdAt: 'ASC' } });
        }

        const storiesCount = await this.storiesRepo.count();
        if (storiesCount === 0) {
            const author = await this.usersRepo.findOne({ order: { createdAt: 'ASC' } });
            if (author) {
                const stories = this.storiesRepo.create([
                    {
                        author,
                        authorDisplayName: 'Sarah M.',
                        content: 'Donations saved lives today!',
                        likesCount: 12,
                    },
                    {
                        author,
                        authorDisplayName: 'Team Volunteer',
                        content: 'Portal donations helped us deliver first aid kits in under 2 hours.',
                        likesCount: 8,
                    },
                ]);
                await this.storiesRepo.save(stories);
                this.logger.log(`✅ Seeded ${stories.length} community stories`);
            }
        }

        const donationsCount = await this.donationsRepo.count();
        if (donationsCount === 0) {
            const donor = await this.usersRepo.findOne({ order: { createdAt: 'ASC' } });
            if (!donor) return;
            const ngo = await this.ngoRepo.findOne({ order: { createdAt: 'ASC' } });
            const txns: DonationTransaction[] = [];

            if (campaigns[0]) {
                txns.push(
                    this.donationsRepo.create({
                        donor,
                        ngo: ngo ?? undefined,
                        campaign: campaigns[0],
                        amount: 150,
                        method: DonationMethod.CARD,
                        currency: 'USD',
                        isSuccessful: true,
                        note: 'Quick donation via portal',
                    }),
                );
            }

            if (campaigns[1]) {
                txns.push(
                    this.donationsRepo.create({
                        donor,
                        ngo: ngo ?? undefined,
                        campaign: campaigns[1],
                        amount: 70,
                        method: DonationMethod.WALLET,
                        currency: 'USD',
                        isSuccessful: true,
                        note: 'Medical support donation',
                    }),
                );
            }

            if (txns.length) {
                await this.donationsRepo.save(txns);
                this.logger.log(`✅ Seeded ${txns.length} donation transactions`);
            }
        }
    }

    private async seedDisasterFrameworkData() {
        const incidentsCount = await this.incidentsRepo.count();
        let incidents: DisasterIncident[] = [];
        if (incidentsCount === 0) {
            incidents = await this.incidentsRepo.save(
                this.incidentsRepo.create([
                    {
                        title: 'Flash Flood Alert - Sector 7',
                        description: 'Water level rising rapidly after heavy rain.',
                        sector: 'SECTOR ISLAMABAD',
                        severity: IncidentSeverity.CRITICAL,
                        status: IncidentStatus.OPEN,
                        latitude: 33.6844,
                        longitude: 73.0479,
                    },
                    {
                        title: 'Landslide Risk - Margalla Foothills',
                        description: 'Crack detection and slope instability reported.',
                        sector: 'SECTOR ISLAMABAD',
                        severity: IncidentSeverity.HIGH,
                        status: IncidentStatus.IN_PROGRESS,
                        latitude: 33.7462,
                        longitude: 73.0888,
                    },
                ]),
            );
            this.logger.log(`✅ Seeded ${incidents.length} disaster incidents`);
        } else {
            incidents = await this.incidentsRepo.find({ take: 2, order: { createdAt: 'ASC' } });
        }

        const commsCount = await this.commsRepo.count();
        if (commsCount === 0) {
            const sender = await this.usersRepo.findOne({ order: { createdAt: 'ASC' } });
            if (sender) {
                const messages = this.commsRepo.create([
                    {
                        sender,
                        channel: 'SECURE CHANNEL',
                        sector: 'SECTOR ISLAMABAD',
                        message: 'Base Alpha: Medical team deployed.',
                    },
                    {
                        sender,
                        channel: 'SECURE CHANNEL',
                        sector: 'SECTOR ISLAMABAD',
                        message: 'Unit 4: Perimeter secured.',
                    },
                    {
                        sender,
                        channel: 'SECURE CHANNEL',
                        sector: 'SECTOR ISLAMABAD',
                        message: 'HQ: Need backup at Sector 7.',
                    },
                ]);
                await this.commsRepo.save(messages);
                this.logger.log(`✅ Seeded ${messages.length} live communication entries`);
            }
        }

        const tasksCount = await this.tasksRepo.count();
        if (tasksCount === 0 && incidents.length) {
            const assignedUser = await this.usersRepo.findOne({ order: { createdAt: 'ASC' } });
            const tasks = this.tasksRepo.create([
                {
                    title: 'Rescue Mission #402',
                    details: 'Deploy boats and first aid responders to flooded streets.',
                    incident: incidents[0],
                    assignedTo: assignedUser ?? undefined,
                    assignedTeam: 'Team Bravo',
                    priority: OperationalTaskPriority.CRITICAL,
                    status: OperationalTaskStatus.ASSIGNED,
                    dueAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
                },
                {
                    title: 'Establish Temporary Medical Camp',
                    details: 'Setup triage zone near Sector 7 school ground.',
                    incident: incidents[0],
                    assignedTo: assignedUser ?? undefined,
                    assignedTeam: 'Team Alpha',
                    priority: OperationalTaskPriority.HIGH,
                    status: OperationalTaskStatus.IN_PROGRESS,
                    dueAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
                },
            ]);
            await this.tasksRepo.save(tasks);
            this.logger.log(`✅ Seeded ${tasks.length} operational tasks`);
        }

        const timelineCount = await this.timelineRepo.count();
        if (timelineCount === 0 && incidents.length) {
            const baseIncident = incidents[0];
            const timeline = this.timelineRepo.create([
                {
                    incident: baseIncident,
                    title: 'Incident Reported: Flash Flood',
                    report: 'Rainfall threshold breached in Sector 7.',
                    eventTime: new Date(Date.now() - 45 * 60 * 1000),
                },
                {
                    incident: baseIncident,
                    title: 'Rescue Units Dispatched',
                    report: 'Two teams moved from central station.',
                    eventTime: new Date(Date.now() - 30 * 60 * 1000),
                },
                {
                    incident: baseIncident,
                    title: 'First Aid Camp Established',
                    report: 'Medical tents activated for affected families.',
                    eventTime: new Date(Date.now() - 15 * 60 * 1000),
                },
            ]);
            await this.timelineRepo.save(timeline);
            this.logger.log(`✅ Seeded ${timeline.length} incident timeline events`);
        }
    }
}
