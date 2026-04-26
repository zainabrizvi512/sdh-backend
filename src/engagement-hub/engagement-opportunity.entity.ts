import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum OpportunityStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

@Entity('engagement_opportunities')
export class EngagementOpportunity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 180 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  city?: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitude: number;

  @Column({ type: 'int', default: 5 })
  radiusKm: number;

  @Column({ type: 'int', default: 120 })
  xpReward: number;

  @Column({ type: 'enum', enum: OpportunityStatus, default: OpportunityStatus.OPEN })
  status: OpportunityStatus;

  @Column({ type: 'timestamp', nullable: true })
  startsAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
