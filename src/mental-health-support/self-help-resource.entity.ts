import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum SelfHelpResourceType {
  GUIDE = 'GUIDE',
  AUDIO = 'AUDIO',
  FORM = 'FORM',
  JOURNAL = 'JOURNAL',
}

@Entity('self_help_resources')
export class SelfHelpResource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: SelfHelpResourceType })
  type: SelfHelpResourceType;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  body?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  contentUrl?: string;

  @Column({ type: 'int', nullable: true })
  durationMinutes?: number;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
