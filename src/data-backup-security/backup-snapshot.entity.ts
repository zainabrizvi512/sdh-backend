import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from 'src/users/user.entity';

export enum SnapshotType {
  HOURLY = 'HOURLY',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
}

@Entity('backup_snapshots')
export class BackupSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'enum', enum: SnapshotType })
  snapshotType: SnapshotType;

  @Column({ type: 'varchar', length: 500, nullable: true })
  storageLocation?: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  checksum?: string;

  @Column({ type: 'bigint', nullable: true })
  sizeBytes?: number;

  @CreateDateColumn()
  createdAt: Date;
}
