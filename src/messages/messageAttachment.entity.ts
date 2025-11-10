// src/messages/messageAttachment.entity.ts
import {
    Column, Entity, ManyToOne, PrimaryGeneratedColumn, JoinColumn, Index,
} from 'typeorm';
import { Message } from './message.entity';

@Entity('message_attachments')
export class MessageAttachment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    // LONG URL support
    @Column({ type: 'text' }) // <-- use text, not varchar(2048)
    url: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    mime?: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    contentType?: string;

    @Column({ type: 'integer', nullable: true })
    sizeBytes?: number;

    @Column({ type: 'integer', nullable: true })
    width?: number;

    @Column({ type: 'integer', nullable: true })
    height?: number;

    @Column({ type: 'integer', nullable: true })
    durationMs?: number;

    @Column({ type: 'text', nullable: true })
    caption?: string;

    @ManyToOne(() => Message, (m) => m.attachments, { onDelete: 'CASCADE', nullable: false })
    @JoinColumn({ name: 'messageId' })
    message: Message;

    @Index()
    @Column({ type: 'uuid' })
    messageId: string;
}
