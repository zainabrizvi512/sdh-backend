import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from 'src/users/user.entity';
import { DisasterIncident } from './disaster-incident.entity';

export enum OperationalTaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum OperationalTaskStatus {
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

@Entity('operational_tasks')
export class OperationalTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 180 })
  title: string;

  @Column({ type: 'text', nullable: true })
  details?: string;

  @ManyToOne(() => DisasterIncident, { nullable: true, onDelete: 'SET NULL' })
  incident?: DisasterIncident;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  assignedTo?: User;

  @Column({ type: 'varchar', length: 120, nullable: true })
  assignedTeam?: string;

  @Column({ type: 'enum', enum: OperationalTaskPriority, default: OperationalTaskPriority.HIGH })
  priority: OperationalTaskPriority;

  @Column({ type: 'enum', enum: OperationalTaskStatus, default: OperationalTaskStatus.ASSIGNED })
  status: OperationalTaskStatus;

  @Column({ type: 'timestamp', nullable: true })
  dueAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
