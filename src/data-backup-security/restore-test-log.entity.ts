import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BackupSnapshot } from './backup-snapshot.entity';

export enum RestoreTestStatus {
  PASSED = 'PASSED',
  FAILED = 'FAILED',
}

@Entity('restore_test_logs')
export class RestoreTestLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => BackupSnapshot, { nullable: false, onDelete: 'CASCADE' })
  snapshot: BackupSnapshot;

  @Column({ type: 'enum', enum: RestoreTestStatus, default: RestoreTestStatus.PASSED })
  status: RestoreTestStatus;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  testedAt: Date;
}
