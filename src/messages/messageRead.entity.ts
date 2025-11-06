import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, Unique, Index } from 'typeorm';
import { Message } from './message.entity';
import { User } from '../users/user.entity';

@Entity('message_reads')
@Unique(['message', 'user'])
export class MessageRead {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Message, { nullable: false })
    @Index()
    message: Message;

    @ManyToOne(() => User, { nullable: false })
    @Index()
    user: User;

    @CreateDateColumn()
    readAt: Date;
}
