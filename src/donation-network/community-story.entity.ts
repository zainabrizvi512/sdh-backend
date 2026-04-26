import { User } from 'src/users/user.entity';
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('community_stories')
export class CommunityStory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  author: User;

  @Column({ type: 'varchar', length: 120 })
  authorDisplayName: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  imageUrl?: string;

  @Column({ type: 'int', default: 0 })
  likesCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
