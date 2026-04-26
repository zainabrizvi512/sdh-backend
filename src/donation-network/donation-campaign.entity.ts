import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum DonationCampaignStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
}

@Entity('donation_campaigns')
export class DonationCampaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 160 })
  title: string;

  @Column({ type: 'varchar', length: 80, default: 'GENERAL' })
  causeCategory: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  imageUrl?: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  goalAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  raisedAmount: number;

  @Column({ type: 'enum', enum: DonationCampaignStatus, default: DonationCampaignStatus.ACTIVE })
  status: DonationCampaignStatus;

  @Column({ type: 'timestamp', nullable: true })
  startsAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  endsAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
