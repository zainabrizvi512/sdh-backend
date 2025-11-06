import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToMany,
    JoinTable,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    Index,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum GroupType {
    FAMILY = 'family',
    FRIENDS = 'friends',
    TEAM = 'team',
    OTHER = 'other',
}

@Entity('groups')
export class Group {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column({ type: 'varchar', length: 150 })
    name: string;

    @Column({ type: 'varchar', length: 300, nullable: true })
    picture?: string;

    @Column({
        type: 'enum',
        enum: GroupType,
        default: GroupType.OTHER,
    })
    type: GroupType;

    // Who created the group (optional but very useful for permissions)
    @ManyToOne(() => User, { nullable: false, eager: true })
    owner: User;

    @ManyToMany(() => User, { cascade: false, eager: true })
    @JoinTable({
        name: 'group_members',
        joinColumn: { name: 'group_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
    })
    members: User[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
