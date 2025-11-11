import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index } from 'typeorm';
import { SafetyGuide } from './safety-guide.entity';

export type ActionType = 'CALL' | 'SMS' | 'URL' | 'MAP';

@Entity('quick_actions')
@Index(['guide', 'order'])
export class QuickAction {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => SafetyGuide, g => g.actions, { onDelete: 'CASCADE' })
    guide: SafetyGuide;

    @Column({ type: 'int', default: 0 })
    order: number;

    @Column({ type: 'varchar', length: 12 })
    type: ActionType;

    @Column({ length: 40 })
    label: string; // e.g., "Call 16 (Fire)"

    @Column({ length: 180, nullable: true })
    payload?: string; // phone number, SMS template, URL, map query

    @Column({ length: 300, nullable: true })
    icon?: string;
}
