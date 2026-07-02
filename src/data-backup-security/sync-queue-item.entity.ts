import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from 'src/users/user.entity';

export enum SyncQueueStatus {
  PENDING = 'PENDING',
  SYNCED = 'SYNCED',
  CONFLICT = 'CONFLICT',
}

@Entity('sync_queue_items')
export class SyncQueueItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'varchar', length: 120 })
  entityType: string;

  @Column({ type: 'uuid', nullable: true })
  entityId?: string;

  @Column({ type: 'jsonb' })
  payload: Record<string, any>;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ type: 'enum', enum: SyncQueueStatus, default: SyncQueueStatus.PENDING })
  status: SyncQueueStatus;

  @Column({ type: 'timestamptz', nullable: true })
  lastAttemptAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
