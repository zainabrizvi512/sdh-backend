import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity({ name: 'risk_assessments', schema: 'public' })
export class RiskAssessment {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Index()
  @Column({ type: 'varchar', length: 80 })
  region: string; // e.g., "PK-ISB"

  @Index()
  @Column({ type: 'uuid', name: 'disasterTypeId' })
  disasterTypeId: string;

  @Column({ type: 'int' })
  score: number; // 0..100

  @Column({ type: 'jsonb', default: {} })
  features: any;

  @CreateDateColumn({ type: 'timestamp without time zone' })
  createdAt: Date;
}
