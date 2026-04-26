import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from 'src/users/user.entity';

export enum VolunteerActivityStatus {
  AVAILABLE = 'AVAILABLE',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity('volunteer_activities')
export class VolunteerActivity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  volunteer: User;

  @Column({ type: 'varchar', length: 180 })
  title: string;

  @Column({ type: 'varchar', length: 80, default: 'GENERAL' })
  category: string;

  @Column({ type: 'enum', enum: VolunteerActivityStatus, default: VolunteerActivityStatus.AVAILABLE })
  status: VolunteerActivityStatus;

  @Column({ type: 'int', default: 100 })
  xpReward: number;

  @Column({ type: 'int', default: 0 })
  livesImpacted: number;

  @Column({ type: 'timestamp', nullable: true })
  startsAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude?: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude?: number;

  @Column({ type: 'varchar', length: 120, nullable: true })
  city?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
