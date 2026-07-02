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
import { MentalHealthProfessional, SessionType } from 'src/mental-health-support/mental-health-professional.entity';
import { MentalHealthNgo } from 'src/mental-health-support/mental-health-ngo.entity';
import { SelfHelpResource, SelfHelpResourceType } from 'src/mental-health-support/self-help-resource.entity';
import { StressTip } from 'src/mental-health-support/stress-tip.entity';
import { AccessControlPolicy, AccessControlRole } from 'src/data-backup-security/access-control-policy.entity';
import { BackupSnapshot, SnapshotType } from 'src/data-backup-security/backup-snapshot.entity';
import { RestoreTestLog, RestoreTestStatus } from 'src/data-backup-security/restore-test-log.entity';
import { FeedbackStatus, FeedbackSubmission } from 'src/reviews-feedback/feedback-submission.entity';

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
        @InjectRepository(MentalHealthProfessional) private readonly mhProfessionalsRepo: Repository<MentalHealthProfessional>,
        @InjectRepository(MentalHealthNgo) private readonly mhNgosRepo: Repository<MentalHealthNgo>,
        @InjectRepository(SelfHelpResource) private readonly selfHelpRepo: Repository<SelfHelpResource>,
        @InjectRepository(StressTip) private readonly stressTipsRepo: Repository<StressTip>,
        @InjectRepository(AccessControlPolicy) private readonly accessPoliciesRepo: Repository<AccessControlPolicy>,
        @InjectRepository(BackupSnapshot) private readonly snapshotsRepo: Repository<BackupSnapshot>,
        @InjectRepository(RestoreTestLog) private readonly restoreTestRepo: Repository<RestoreTestLog>,
        @InjectRepository(FeedbackSubmission) private readonly feedbackRepo: Repository<FeedbackSubmission>,
    ) {}

    async onApplicationBootstrap() {
        try {
            await this.ensureSystemUserAndGlobalGroup();
            await this.seedEngagementHubData();
            await this.seedDonationNetworkData();
            await this.seedDisasterFrameworkData();
            await this.seedMentalHealthData();
            await this.seedDataBackupSecurityData();
            await this.seedReviewsFeedbackData();
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

    private async seedMentalHealthData() {
        const professionalsCount = await this.mhProfessionalsRepo.count();
        if (professionalsCount === 0) {
            await this.mhProfessionalsRepo.save(
                this.mhProfessionalsRepo.create([
                    {
                        name: 'Dr. Sarah Khan',
                        specialty: 'Clinical Psychologist',
                        sessionType: SessionType.VIDEO,
                        availabilityLabel: '24h',
                    },
                    {
                        name: 'Dr. Ali Rehman',
                        specialty: 'Trauma Counsellor',
                        sessionType: SessionType.VOICE,
                        availabilityLabel: '2h',
                    },
                    {
                        name: 'Dr. Ayesha Malik',
                        specialty: 'Crisis Intervention Specialist',
                        sessionType: SessionType.VIDEO,
                        availabilityLabel: '6h',
                    },
                ]),
            );
        }

        const ngosCount = await this.mhNgosRepo.count();
        if (ngosCount === 0) {
            await this.mhNgosRepo.save(
                this.mhNgosRepo.create([
                    {
                        name: 'Rozan Helpline',
                        description: 'Crisis emotional support and referrals',
                        helpline: '1091',
                        websiteUrl: 'https://rozan.org',
                    },
                    {
                        name: 'Taskeen Wellness Network',
                        description: 'Community groups for stress and grief recovery',
                        helpline: '0800-111-222',
                        websiteUrl: 'https://taskeen.org',
                    },
                    {
                        name: 'Umang Pakistan',
                        description: 'Youth mental health support and peer counselling',
                        helpline: '0311-7786264',
                        websiteUrl: 'https://umang.com.pk',
                    },
                ]),
            );
        }

        const resourcesCount = await this.selfHelpRepo.count();
        if (resourcesCount === 0) {
            await this.selfHelpRepo.save(
                this.selfHelpRepo.create([
                    {
                        type: SelfHelpResourceType.GUIDE,
                        title: 'Grounding guide (5-4-3-2-1 method)',
                        body: 'Name 5 things you see, 4 you feel, 3 you hear, 2 you smell, and 1 you taste. Repeat until calm returns.',
                        sortOrder: 1,
                    },
                    {
                        type: SelfHelpResourceType.AUDIO,
                        title: 'Sleep and anxiety audio routines',
                        body: 'Guided 12-minute wind-down for post-shift recovery.',
                        contentUrl: 'https://cdn.sdh.local/audio/sleep-anxiety-routine.mp3',
                        durationMinutes: 12,
                        sortOrder: 2,
                    },
                    {
                        type: SelfHelpResourceType.FORM,
                        title: 'Burnout and panic quick-check forms',
                        body: 'A 6-question self-check to identify early burnout or panic signals.',
                        sortOrder: 3,
                    },
                    {
                        type: SelfHelpResourceType.JOURNAL,
                        title: 'Guided journal prompts',
                        body: 'What drained me today? What gave me strength? Who can I reach out to right now?',
                        sortOrder: 4,
                    },
                ]),
            );
        }

        const tipsCount = await this.stressTipsRepo.count();
        if (tipsCount === 0) {
            await this.stressTipsRepo.save(
                this.stressTipsRepo.create([
                    { title: '4-7-8 breathing for 2 minutes', body: 'Inhale 4s, hold 7s, exhale 8s. Repeat 4 cycles.', sortOrder: 1 },
                    { title: 'Hydrate and avoid doom scrolling', body: 'Drink water and pause news feeds for 30 minutes after a shift.', sortOrder: 2 },
                    { title: 'Take 10-minute sunlight walk', body: 'Step outside, move slowly, and reset your nervous system.', sortOrder: 3 },
                    { title: 'Talk to one trusted person daily', body: 'A short check-in call can reduce isolation and stress load.', sortOrder: 4 },
                ]),
            );
        }
    }

    private async seedDataBackupSecurityData() {
        const policiesCount = await this.accessPoliciesRepo.count();
        if (policiesCount === 0) {
            await this.accessPoliciesRepo.save(
                this.accessPoliciesRepo.create([
                    {
                        role: AccessControlRole.ADMIN,
                        description: 'Full data restore and user permission management',
                        permissions: { fullDataRestore: true, manageUserPermissions: true, exportReports: true, auditAccess: true },
                    },
                    {
                        role: AccessControlRole.SUPERVISOR,
                        description: 'Scoped report export and audit access',
                        permissions: { fullDataRestore: false, manageUserPermissions: false, exportReports: true, auditAccess: true },
                    },
                    {
                        role: AccessControlRole.FIELD_USER,
                        description: 'Read/write assigned incident records only',
                        permissions: { fullDataRestore: false, manageUserPermissions: false, exportReports: false, auditAccess: false, assignedIncidentsOnly: true },
                    },
                ]),
            );
        }

        const users = await this.usersRepo.find({ order: { createdAt: 'ASC' } });
        const realUsers = users.filter((u) => u.sub !== 'sdh-system');
        if (realUsers.length === 0) return;

        for (const seedUser of realUsers) {
            const snapshotsCount = await this.snapshotsRepo.count({
                where: { user: { id: seedUser.id } },
            });
            if (snapshotsCount > 0) continue;

            const now = Date.now();
            const snapshots = await this.snapshotsRepo.save(
                this.snapshotsRepo.create([
                    {
                        user: seedUser,
                        snapshotType: SnapshotType.HOURLY,
                        storageLocation: `backups/${seedUser.id}/hourly/${now - 60 * 60 * 1000}`,
                        checksum: 'sha256-a1b2c3d4-hourly',
                        sizeBytes: 52428800,
                        createdAt: new Date(now - 60 * 60 * 1000),
                    },
                    {
                        user: seedUser,
                        snapshotType: SnapshotType.DAILY,
                        storageLocation: `backups/${seedUser.id}/daily/${now - 24 * 60 * 60 * 1000}`,
                        checksum: 'sha256-e5f6g7h8-daily',
                        sizeBytes: 314572800,
                        createdAt: new Date(now - 24 * 60 * 60 * 1000),
                    },
                    {
                        user: seedUser,
                        snapshotType: SnapshotType.WEEKLY,
                        storageLocation: `backups/${seedUser.id}/weekly/${now - 7 * 24 * 60 * 60 * 1000}`,
                        checksum: 'sha256-i9j0k1l2-weekly',
                        sizeBytes: 1073741824,
                        createdAt: new Date(now - 7 * 24 * 60 * 60 * 1000),
                    },
                ]),
            );

            if (snapshots[0]) {
                await this.restoreTestRepo.save(
                    this.restoreTestRepo.create({
                        snapshot: snapshots[0],
                        status: RestoreTestStatus.PASSED,
                        notes: 'Automated restore verification completed — all integrity checks passed',
                        testedAt: new Date(now - 4 * 60 * 60 * 1000),
                    }),
                );
            }
        }
    }

    private async seedReviewsFeedbackData() {
        const feedbackCount = await this.feedbackRepo.count();
        if (feedbackCount > 0) return;

        const [responder] = await this.usersRepo.find({ order: { createdAt: 'ASC' }, take: 1 });

        await this.feedbackRepo.save(
            this.feedbackRepo.create([
                {
                    user: responder,
                    rating: 5,
                    comment: 'Emergency routing is smooth and accurate',
                    isAnonymous: false,
                    submitterLabel: 'Field Responder',
                    status: FeedbackStatus.APPROVED,
                },
                {
                    rating: 3,
                    comment: 'Need simpler task assignment filters',
                    isAnonymous: true,
                    submitterLabel: 'Anonymous',
                    status: FeedbackStatus.PENDING,
                },
                {
                    user: responder,
                    rating: 4,
                    comment: 'Mental health resources are helpful during long shifts',
                    isAnonymous: false,
                    submitterLabel: 'Field Responder',
                    status: FeedbackStatus.APPROVED,
                },
                {
                    rating: 2,
                    comment: 'Sync failed twice during critical incident — urgent fix needed',
                    isAnonymous: true,
                    submitterLabel: 'Anonymous',
                    status: FeedbackStatus.FLAGGED,
                },
                {
                    user: responder,
                    rating: 5,
                    comment: 'Donation portal is fast and transparent',
                    isAnonymous: false,
                    submitterLabel: 'Field Responder',
                    status: FeedbackStatus.APPROVED,
                },
                {
                    rating: 4,
                    comment: 'Love the stress tips section — would like audio versions',
                    isAnonymous: true,
                    submitterLabel: 'Anonymous',
                    status: FeedbackStatus.PENDING,
                },
                {
                    user: responder,
                    rating: 1,
                    comment: 'App crashed during backup restore test',
                    isAnonymous: false,
                    submitterLabel: 'Supervisor',
                    status: FeedbackStatus.ESCALATED,
                },
            ]),
        );
    }
}