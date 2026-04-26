import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from 'src/users/user.entity';

@Entity('live_communications')
export class LiveCommunication {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  sender: User;

  @Column({ type: 'varchar', length: 150, default: 'SECURE CHANNEL' })
  channel: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  sector?: string;

  @CreateDateColumn()
  createdAt: Date;
}
