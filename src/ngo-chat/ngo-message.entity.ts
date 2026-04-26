import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity'; // Adjust path
import { NGO } from '../ngo/ngo.entity';     // Adjust path

@Entity('ngo_messages')
export class NgoMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  text: string;

  // Foreign Key to NGO
  @ManyToOne(() => NGO, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ngoId' })
  ngo: NGO;

  @Column({ nullable: true })
  ngoId: string; // Helper column for querying

  // Foreign Key to Sender
  @ManyToOne(() => User, { eager: true }) // Eager load to show sender name
  sender: User;

  @CreateDateColumn()
  createdAt: Date;
}