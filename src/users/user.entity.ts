import {
    Index,
    Unique,
} from 'typeorm';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

@Entity('users')
@Unique(['sub'])
@Unique(['email'])
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    // Auth0 subject: e.g., "email|690076a17f62a8c3ba845a51"
    @Index()
    @Column({ type: 'varchar', length: 190 })
    sub: string;

    @Column({ type: 'varchar', length: 190 })
    email: string;

    @Column({ type: 'varchar', length: 30, nullable: true })
    phone: string;

    @Column({ type: 'varchar', length: 250, nullable: true })
    name: string;

    @Column({ type: 'varchar', length: 300, nullable: true })
    picture?: string;

    // from 'nickname' in your JSON, stored as username
    @Column({ type: 'varchar', length: 120, nullable: true })
    username?: string;

    @Column({ type: 'varchar', length: 50 })
    connectionType: string; // e.g., 'email', 'google-oauth2', etc.

    @Column({ type: 'point', nullable: true })
    location?: string; // e.g. "(73.0479,33.6844)"  => (lon, lat)

    @Column({ type: 'varchar', length: 120, nullable: true })
    city?: string;

    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    latitude?: number;

    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    longitude?: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column({ type: 'enum', enum: Gender, nullable: true })
    gender?: Gender;

    
}
