import { NGO } from 'src/ngo/ngo.entity';
import { User } from 'src/users/user.entity';
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { DonationCampaign } from './donation-campaign.entity';

export enum DonationMethod {
  CARD = 'CARD',
  BANK = 'BANK',
  WALLET = 'WALLET',
  CASH = 'CASH',
}

@Entity('donation_transactions')
export class DonationTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  donor: User;

  @ManyToOne(() => NGO, { nullable: true, onDelete: 'SET NULL' })
  ngo?: NGO;

  @ManyToOne(() => DonationCampaign, { nullable: true, onDelete: 'SET NULL' })
  campaign?: DonationCampaign;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: DonationMethod, default: DonationMethod.CARD })
  method: DonationMethod;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency: string;

  @Column({ type: 'boolean', default: true })
  isSuccessful: boolean;

  @Column({ type: 'varchar', length: 200, nullable: true })
  note?: string;

  @CreateDateColumn()
  createdAt: Date;
}
