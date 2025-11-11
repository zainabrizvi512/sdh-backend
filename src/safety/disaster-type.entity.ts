import { Entity, PrimaryGeneratedColumn, Column, Index, OneToMany } from 'typeorm';
import { SafetyGuide } from './safety-guide.entity';

@Entity('disaster_types')
export class DisasterType {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index({ unique: true })
    @Column({ length: 80 })
    slug: string; // e.g., "earthquake", "flood"

    @Column({ length: 120 })
    name: string; // Human label

    @OneToMany(() => SafetyGuide, g => g.disasterType)
    guides: SafetyGuide[];
}
