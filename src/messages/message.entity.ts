import {
    Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany,
    CreateDateColumn, UpdateDateColumn, Index
} from 'typeorm';
import { User } from '../users/user.entity';
import { Group } from 'src/group/group.entity';
import { MessageAttachment } from './messageAttachment.entity';

export enum MessageType {
    TEXT = 'text',
    IMAGE = 'image', // message that’s mainly an image with optional caption
}

@Entity('messages')
export class Message {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Group, { nullable: false })
    @Index()
    group: Group;

    @ManyToOne(() => User, { nullable: false, eager: true })
    sender: User;

    @Column({ type: 'enum', enum: MessageType, default: MessageType.TEXT })
    type: MessageType;

    @Column({ type: 'text', nullable: true })
    text?: string; // optional if images only

    @OneToMany(() => MessageAttachment, (a) => a.message, { cascade: true, eager: true })
    attachments: MessageAttachment[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // soft edit flag (no history for brevity)
    @Column({ default: false })
    edited: boolean;
}
