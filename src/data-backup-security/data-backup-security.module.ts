import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/user.entity';
import { AccessControlPolicy } from './access-control-policy.entity';
import { BackupSettings } from './backup-settings.entity';
import { BackupSnapshot } from './backup-snapshot.entity';
import { DataBackupSecurityController } from './data-backup-security.controller';
import { DataBackupSecurityService } from './data-backup-security.service';
import { RestoreTestLog } from './restore-test-log.entity';
import { SyncQueueItem } from './sync-queue-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      BackupSettings,
      AccessControlPolicy,
      BackupSnapshot,
      RestoreTestLog,
      SyncQueueItem,
    ]),
  ],
  controllers: [DataBackupSecurityController],
  providers: [DataBackupSecurityService],
  exports: [DataBackupSecurityService],
})
export class DataBackupSecurityModule { }
