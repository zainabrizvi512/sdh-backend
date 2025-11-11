import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index } from 'typeorm';
import { SafetyGuide } from './safety-guide.entity';

@Entity('checklist_items')
@Index(['guide', 'order'])
export class ChecklistItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => SafetyGuide, g => g.checklist, { onDelete: 'CASCADE' })
    guide: SafetyGuide;

    @Column({ type: 'int', default: 0 })
    order: number;

    @Column({ length: 200 })
    label: string;

    @Column({ default: false })
    recommended: boolean; // show on top for quick prep
}
