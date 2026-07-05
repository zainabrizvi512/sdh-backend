import { User } from 'src/users/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'varchar', length: 40 })
  type: string; // emergencyAlerts | news | chatMessages | donationUpdates

  @Column({ type: 'varchar', length: 160 })
  title: string;

  @Column({ type: 'text', nullable: true })
  body?: string;

  @Column({ type: 'jsonb', nullable: true })
  data?: Record<string, unknown>;

  @Index()
  @Column({ type: 'boolean', default: false })
  read: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
