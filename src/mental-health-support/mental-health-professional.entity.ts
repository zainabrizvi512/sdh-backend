import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum SessionType {
  VIDEO = 'VIDEO',
  VOICE = 'VOICE',
}

@Entity('mental_health_professionals')
export class MentalHealthProfessional {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 160 })
  name: string;

  @Column({ type: 'varchar', length: 120 })
  specialty: string;

  @Column({ type: 'enum', enum: SessionType, default: SessionType.VIDEO })
  sessionType: SessionType;

  @Column({ type: 'varchar', length: 40, default: '24h' })
  availabilityLabel: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
