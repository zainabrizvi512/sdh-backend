import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from 'src/users/user.entity';
import { FeedbackSubmission, FeedbackStatus } from './feedback-submission.entity';

@Entity('feedback_moderation_events')
export class FeedbackModerationEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => FeedbackSubmission, { nullable: false, onDelete: 'CASCADE' })
  feedback: FeedbackSubmission;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  actor?: User;

  @Column({ type: 'enum', enum: FeedbackStatus })
  action: FeedbackStatus;

  @Column({ type: 'text', nullable: true })
  note?: string;

  @CreateDateColumn()
  createdAt: Date;
}
