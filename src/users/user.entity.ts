import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    Index,
    Unique,
} from 'typeorm';

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

    @Column({ type: 'varchar', length: 300, nullable: true })
    picture?: string;

    // from 'nickname' in your JSON, stored as username
    @Column({ type: 'varchar', length: 120, nullable: true })
    username?: string;

    @Column({ type: 'varchar', length: 50 })
    connectionType: string; // e.g., 'email', 'google-oauth2', etc.

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
