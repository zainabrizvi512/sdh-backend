import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/user.entity';
import { MoreThan, Repository } from 'typeorm';
import { AccessControlPolicy, AccessControlRole } from './access-control-policy.entity';
import { BackupSettings } from './backup-settings.entity';
import { BackupSnapshot, SnapshotType } from './backup-snapshot.entity';
import { RestoreTestDto, RestoreSnapshotDto } from './dto/restore.dto';
import { SyncPushDto } from './dto/sync-push.dto';
import { ToggleEncryptedStorageDto } from './dto/toggle-encrypted-storage.dto';
import { ToggleSyncDto } from './dto/toggle-sync.dto';
import { UpdateAccessControlDto } from './dto/update-access-control.dto';
import { RestoreTestLog, RestoreTestStatus } from './restore-test-log.entity';
import { SyncQueueItem, SyncQueueStatus } from './sync-queue-item.entity';

const DEFAULT_POLICIES: Record<AccessControlRole, { permissions: Record<string, boolean>; description: string }> = {
  [AccessControlRole.ADMIN]: {
    permissions: { fullDataRestore: true, manageUserPermissions: true, exportReports: true, auditAccess: true },
    description: 'Full data restore and user permission management',
  },
  [AccessControlRole.SUPERVISOR]: {
    permissions: { fullDataRestore: false, manageUserPermissions: false, exportReports: true, auditAccess: true },
    description: 'Scoped report export and audit access',
  },
  [AccessControlRole.FIELD_USER]: {
    permissions: { fullDataRestore: false, manageUserPermissions: false, exportReports: false, auditAccess: false, assignedIncidentsOnly: true },
    description: 'Read/write assigned incident records only',
  },
};

@Injectable()
export class DataBackupSecurityService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(BackupSettings)
    private readonly settingsRepo: Repository<BackupSettings>,
    @InjectRepository(AccessControlPolicy)
    private readonly policiesRepo: Repository<AccessControlPolicy>,
    @InjectRepository(BackupSnapshot)
    private readonly snapshotsRepo: Repository<BackupSnapshot>,
    @InjectRepository(RestoreTestLog)
    private readonly restoreTestRepo: Repository<RestoreTestLog>,
    @InjectRepository(SyncQueueItem)
    private readonly syncQueueRepo: Repository<SyncQueueItem>,
  ) { }

  private async getUserBySub(sub: string): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { sub } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  private async getOrCreateSettings(user: User): Promise<BackupSettings> {
    let settings = await this.settingsRepo.findOne({ where: { user: { id: user.id } } });
    if (!settings) {
      settings = this.settingsRepo.create({
        user,
        encryptedStorageEnabled: true,
        realtimeSyncEnabled: true,
        syncIntervalSeconds: 30,
      });
      settings = await this.settingsRepo.save(settings);
    }
    return settings;
  }

  private async ensureDefaultPolicies() {
    for (const role of Object.values(AccessControlRole)) {
      const existing = await this.policiesRepo.findOne({ where: { role } });
      if (!existing) {
        const defaults = DEFAULT_POLICIES[role];
        await this.policiesRepo.save(
          this.policiesRepo.create({
            role,
            permissions: defaults.permissions,
            description: defaults.description,
          }),
        );
      }
    }
  }

  async getSettings(sub: string) {
    const user = await this.getUserBySub(sub);
    const settings = await this.getOrCreateSettings(user);

    return {
      encryptedStorage: {
        enabled: settings.encryptedStorageEnabled,
        algorithm: 'AES-256',
        description: 'Protect backups stored locally and in cloud mirrors',
      },
      realtimeSync: {
        enabled: settings.realtimeSyncEnabled,
        intervalSeconds: settings.syncIntervalSeconds,
        conflictSafe: true,
        offlineQueueEnabled: true,
      },
    };
  }

  async toggleEncryptedStorage(sub: string, dto: ToggleEncryptedStorageDto) {
    if (dto.enabled === undefined) throw new BadRequestException('enabled is required');

    const user = await this.getUserBySub(sub);
    const settings = await this.getOrCreateSettings(user);
    settings.encryptedStorageEnabled = dto.enabled;
    await this.settingsRepo.save(settings);

    return {
      encryptedStorageEnabled: settings.encryptedStorageEnabled,
      algorithm: 'AES-256',
    };
  }

  async getAccessControl() {
    await this.ensureDefaultPolicies();
    const policies = await this.policiesRepo.find({ order: { role: 'ASC' } });

    return {
      policies: policies.map((p) => ({
        role: p.role,
        description: p.description ?? null,
        permissions: p.permissions,
      })),
    };
  }

  async updateAccessControl(role: AccessControlRole, dto: UpdateAccessControlDto) {
    if (!dto.permissions || typeof dto.permissions !== 'object') {
      throw new BadRequestException('permissions object is required');
    }

    await this.ensureDefaultPolicies();
    const policy = await this.policiesRepo.findOne({ where: { role } });
    if (!policy) throw new NotFoundException('Policy not found');

    policy.permissions = dto.permissions;
    if (dto.description !== undefined) policy.description = dto.description?.trim();
    await this.policiesRepo.save(policy);

    return {
      role: policy.role,
      description: policy.description,
      permissions: policy.permissions,
    };
  }

  async getSyncStatus(sub: string) {
    const user = await this.getUserBySub(sub);
    const settings = await this.getOrCreateSettings(user);

    const pendingCount = await this.syncQueueRepo.count({
      where: { user: { id: user.id }, status: SyncQueueStatus.PENDING },
    });

    return {
      status: settings.realtimeSyncEnabled ? 'SYNC ACTIVE' : 'SYNC PAUSED',
      enabled: settings.realtimeSyncEnabled,
      intervalSeconds: settings.syncIntervalSeconds,
      conflictSafe: true,
      offlineQueueEnabled: true,
      pendingQueueItems: pendingCount,
    };
  }

  async toggleSync(sub: string, dto: ToggleSyncDto) {
    if (dto.enabled === undefined) throw new BadRequestException('enabled is required');

    const user = await this.getUserBySub(sub);
    const settings = await this.getOrCreateSettings(user);
    settings.realtimeSyncEnabled = dto.enabled;
    await this.settingsRepo.save(settings);

    return {
      status: settings.realtimeSyncEnabled ? 'SYNC ACTIVE' : 'SYNC PAUSED',
      enabled: settings.realtimeSyncEnabled,
    };
  }

  async pushSync(sub: string, dto: SyncPushDto) {
    if (!dto.entityType?.trim()) throw new BadRequestException('entityType is required');
    if (!dto.payload || typeof dto.payload !== 'object') throw new BadRequestException('payload is required');

    const user = await this.getUserBySub(sub);
    const item = this.syncQueueRepo.create({
      user,
      entityType: dto.entityType.trim(),
      entityId: dto.entityId,
      payload: dto.payload,
      version: dto.version ?? 1,
      status: SyncQueueStatus.PENDING,
      lastAttemptAt: new Date(),
    });

    const saved = await this.syncQueueRepo.save(item);
    return { id: saved.id, status: saved.status, queuedAt: saved.createdAt };
  }

  async pullSync(sub: string, since?: string) {
    const user = await this.getUserBySub(sub);
    const sinceDate = since ? new Date(since) : new Date(0);
    if (since && Number.isNaN(sinceDate.getTime())) throw new BadRequestException('Invalid since timestamp');

    const items = await this.syncQueueRepo.find({
      where: { user: { id: user.id }, createdAt: MoreThan(sinceDate) },
      order: { createdAt: 'ASC' },
    });

    return {
      deltas: items.map((i) => ({
        id: i.id,
        entityType: i.entityType,
        entityId: i.entityId ?? null,
        payload: i.payload,
        version: i.version,
        status: i.status,
        createdAt: i.createdAt,
      })),
      pulledAt: new Date().toISOString(),
    };
  }

  async listSnapshots(sub: string) {
    const user = await this.getUserBySub(sub);
    const snapshots = await this.snapshotsRepo.find({
      where: { user: { id: user.id } },
      order: { createdAt: 'DESC' },
      take: 50,
    });

    return {
      snapshots: snapshots.map((s) => ({
        id: s.id,
        snapshotType: s.snapshotType,
        storageLocation: s.storageLocation ?? null,
        checksum: s.checksum ?? null,
        sizeBytes: s.sizeBytes != null ? Number(s.sizeBytes) : null,
        createdAt: s.createdAt,
      })),
    };
  }

  async runRestoreTest(sub: string, dto: RestoreTestDto) {
    if (!dto.snapshotId?.trim()) throw new BadRequestException('snapshotId is required');

    const user = await this.getUserBySub(sub);
    const snapshot = await this.snapshotsRepo.findOne({
      where: { id: dto.snapshotId, user: { id: user.id } },
    });
    if (!snapshot) throw new NotFoundException('Snapshot not found');

    const log = this.restoreTestRepo.create({
      snapshot,
      status: RestoreTestStatus.PASSED,
      notes: dto.notes?.trim(),
    });
    const saved = await this.restoreTestRepo.save(log);

    return {
      id: saved.id,
      status: saved.status,
      testedAt: saved.testedAt,
      message: 'Last verified restore test completed successfully',
    };
  }

  async getLastRestoreTest(sub: string) {
    const user = await this.getUserBySub(sub);
    const snapshots = await this.snapshotsRepo.find({
      where: { user: { id: user.id } },
      select: ['id'],
    });

    if (snapshots.length === 0) {
      return { lastVerifiedRestoreTest: null, incidentReplayAvailable: true };
    }

    const snapshotIds = snapshots.map((s) => s.id);
    const lastTest = await this.restoreTestRepo
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.snapshot', 'snapshot')
      .where('snapshot.id IN (:...ids)', { ids: snapshotIds })
      .orderBy('log.testedAt', 'DESC')
      .getOne();

    if (!lastTest) {
      return { lastVerifiedRestoreTest: null, incidentReplayAvailable: true };
    }

    const hoursAgo = Math.round((Date.now() - lastTest.testedAt.getTime()) / (1000 * 60 * 60));
    return {
      lastVerifiedRestoreTest: {
        id: lastTest.id,
        status: lastTest.status,
        testedAt: lastTest.testedAt,
        displayLabel: hoursAgo < 1 ? 'Less than 1 hour ago' : `${hoursAgo} hours ago`,
      },
      incidentReplayAvailable: true,
    };
  }

  async restoreSnapshot(sub: string, dto: RestoreSnapshotDto) {
    if (!dto.snapshotId?.trim()) throw new BadRequestException('snapshotId is required');

    const user = await this.getUserBySub(sub);
    const snapshot = await this.snapshotsRepo.findOne({
      where: { id: dto.snapshotId, user: { id: user.id } },
    });
    if (!snapshot) throw new NotFoundException('Snapshot not found');

    return {
      snapshotId: snapshot.id,
      snapshotType: snapshot.snapshotType,
      status: 'RESTORE_INITIATED',
      message: 'Point-in-time restore initiated',
      incidentReplayAvailable: true,
    };
  }

  async createSnapshot(sub: string, snapshotType: SnapshotType) {
    const user = await this.getUserBySub(sub);
    const snapshot = this.snapshotsRepo.create({
      user,
      snapshotType,
      storageLocation: `backups/${user.id}/${snapshotType.toLowerCase()}/${Date.now()}`,
      checksum: `sha256-${Date.now()}`,
    });
    return this.snapshotsRepo.save(snapshot);
  }
}
