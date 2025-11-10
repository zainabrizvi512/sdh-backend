import {
    Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany,
    CreateDateColumn, UpdateDateColumn, Index
} from 'typeorm';
import { User } from '../users/user.entity';
import { Group } from 'src/group/group.entity';
import { MessageAttachment } from './messageAttachment.entity';

export enum MessageType {
    TEXT = 'text',
    IMAGE = 'image',
    LOCATION = 'location',
    AUDIO = 'audio'
}

export type MessageKind = "text" | "location" | "system" | "audio";

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

    @Column({ type: "enum", enum: ["text", "location", "system", "audio", "image"], default: "text" })
    kind!: MessageKind;

    @OneToMany(() => MessageAttachment, (a) => a.message, { cascade: true, eager: true })
    attachments: MessageAttachment[];

    @Column({ type: "double precision", nullable: true })
    location_lat: number | null;

    @Column({ type: "double precision", nullable: true })
    location_lng: number | null;

    @Column({ type: "double precision", nullable: true })
    location_accuracy: number | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // soft edit flag (no history for brevity)
    @Column({ default: false })
    edited: boolean;
}
