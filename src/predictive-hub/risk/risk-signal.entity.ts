import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity({ name: 'risk_signals', schema: 'public' })
export class RiskSignal {
  @PrimaryGeneratedColumn('uuid') 
  id: string;

  @Index() 
  @Column({ type: 'varchar', length: 80, nullable: true }) 
  region: string;

  // Made nullable so SOS signals don't require a specific disaster ID immediately
  @Index() 
  @Column({ type: 'uuid', name: 'disasterTypeId', nullable: true }) 
  disasterTypeId: string;

  @Column({ type: 'varchar', length: 40 })
  source: string; // 'weather' | 'report' | 'sensor' | 'manual' | 'USER_SOS'

  // --- NEW FIELDS ADDED FOR EMERGENCY MODULE ---

  @Column({ type: 'varchar', length: 50, nullable: true })
  risk_type: string; // e.g., 'SOS', 'FIRE', 'FLOOD'

  @Column({ type: 'float', nullable: true })
  latitude: number;

  @Column({ type: 'float', nullable: true })
  longitude: number;

  @Column({ type: 'int', default: 0 })
  score: number; // 0-100 (100 = Critical/SOS)

  @Column({ type: 'text', nullable: true })
  description: string;

  // ---------------------------------------------

  @Column({ type: 'jsonb', nullable: true })
  payload: any;

  @CreateDateColumn({ type: 'timestamp without time zone' })
  createdAt: Date;
}