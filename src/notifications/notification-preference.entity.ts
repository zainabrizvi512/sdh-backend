import { User } from 'src/users/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('notification_preferences')
export class NotificationPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column({ type: 'boolean', default: true })
  emergencyAlerts: boolean;

  @Column({ type: 'boolean', default: true })
  news: boolean;

  @Column({ type: 'boolean', default: true })
  chatMessages: boolean;

  @Column({ type: 'boolean', default: true })
  donationUpdates: boolean;

  @UpdateDateColumn()
  updatedAt: Date;
}
