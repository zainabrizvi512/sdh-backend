import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity({ name: 'risk_signals', schema: 'public' })
export class RiskSignal {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Index() @Column({ type: 'varchar', length: 80 }) region: string;
  @Index() @Column({ type: 'uuid', name: 'disasterTypeId' }) disasterTypeId: string;

  @Column({ type: 'varchar', length: 40 })
  source: string; // 'weather' | 'report' | 'sensor' | 'manual'

  @Column({ type: 'jsonb' })
  payload: any;

  @CreateDateColumn({ type: 'timestamp without time zone' })
  createdAt: Date;
}
