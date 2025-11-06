import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index } from 'typeorm';
import { Message } from './message.entity';

@Entity('message_attachments')
export class MessageAttachment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Message, { nullable: false })
    @Index()
    message: Message;

    @Column({ type: 'varchar', length: 600 })
    url: string; // e.g., S3/Cloudinary https URL

    @Column({ type: 'varchar', length: 120, nullable: true })
    contentType?: string; // image/jpeg, image/png, etc.

    @Column({ type: 'int', nullable: true })
    sizeBytes?: number;

    @Column({ type: 'varchar', length: 300, nullable: true })
    caption?: string;
}
