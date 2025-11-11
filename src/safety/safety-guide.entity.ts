import {
    Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany,
    CreateDateColumn, UpdateDateColumn, Index
} from 'typeorm';
import { DisasterType } from './disaster-type.entity';
import { GuideStep } from './guide-step.entity';
import { ChecklistItem } from './checklist-item.entity';
import { QuickAction } from './quick-action.entity';
import { ResourceLink } from './resource-link.entity';

@Entity('safety_guides')
@Index(['disasterType', 'regionCity', 'regionProvince', 'locale'], { unique: true })
export class SafetyGuide {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => DisasterType, (d) => d.guides, { eager: true, onDelete: 'CASCADE' })
    disasterType: DisasterType;

    @Column({ type: 'varchar', length: 120 })
    title: string;

    @Column({ type: 'varchar', length: 10, default: 'en' })
    locale: string;

    // 👇 explicitly declare type for nullable strings
    @Column({ type: 'varchar', length: 80, nullable: true })
    regionCity: string | null;

    @Column({ type: 'varchar', length: 80, nullable: true })
    regionProvince: string | null;

    @Column({ type: 'boolean', default: false })
    published: boolean;

    @CreateDateColumn({ type: 'timestamp with time zone' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp with time zone' })
    updatedAt: Date;

    @OneToMany(() => GuideStep, s => s.guide, { cascade: true })
    steps: GuideStep[];

    @OneToMany(() => ChecklistItem, c => c.guide, { cascade: true })
    checklist: ChecklistItem[];

    @OneToMany(() => QuickAction, a => a.guide, { cascade: true })
    actions: QuickAction[];

    @OneToMany(() => ResourceLink, r => r.guide, { cascade: true })
    resources: ResourceLink[];
}
