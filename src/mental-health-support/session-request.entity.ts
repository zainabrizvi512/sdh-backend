import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from 'src/users/user.entity';
import { MentalHealthProfessional } from './mental-health-professional.entity';

export enum SessionRequestStatus {
  REQUESTED = 'REQUESTED',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity('mental_health_session_requests')
export class MentalHealthSessionRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => MentalHealthProfessional, { nullable: false, onDelete: 'CASCADE' })
  professional: MentalHealthProfessional;

  @Column({ type: 'enum', enum: SessionRequestStatus, default: SessionRequestStatus.REQUESTED })
  status: SessionRequestStatus;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
