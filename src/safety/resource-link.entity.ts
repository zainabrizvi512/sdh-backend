import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index } from 'typeorm';
import { SafetyGuide } from './safety-guide.entity';

@Entity('resource_links')
@Index(['guide', 'order'])
export class ResourceLink {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => SafetyGuide, g => g.resources, { onDelete: 'CASCADE' })
    guide: SafetyGuide;

    @Column({ type: 'int', default: 0 })
    order: number;

    @Column({ length: 160 })
    title: string;

    @Column({ length: 500 })
    url: string;

    @Column({ length: 100, nullable: true })
    source?: string; // e.g., NDMA, PDMA, WHO
}
