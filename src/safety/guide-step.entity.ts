import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index } from 'typeorm';
import { SafetyGuide } from './safety-guide.entity';

export type GuidePhase = 'BEFORE' | 'DURING' | 'AFTER';

@Entity('guide_steps')
@Index(['guide', 'phase', 'order'])
export class GuideStep {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => SafetyGuide, g => g.steps, { onDelete: 'CASCADE' })
    guide: SafetyGuide;

    @Column({ type: 'varchar', length: 10 })
    phase: GuidePhase;

    @Column({ type: 'int', default: 0 })
    order: number;

    @Column({ type: 'varchar', length: 180 })
    title: string;

    @Column({ type: 'text' })
    body: string; // rich text/markdown allowed

    @Column({ type: 'varchar', length: 300, nullable: true })
    icon?: string; // optional icon name/url
}
