import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { DisasterIncident } from './disaster-incident.entity';

@Entity('incident_timeline_events')
export class IncidentTimelineEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => DisasterIncident, { nullable: false, onDelete: 'CASCADE' })
  incident: DisasterIncident;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  report?: string;

  @Column({ type: 'timestamp', nullable: true })
  eventTime?: Date;

  @CreateDateColumn()
  createdAt: Date;
}
