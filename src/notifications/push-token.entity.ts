import { User } from 'src/users/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

export enum DevicePlatform {
  IOS = 'ios',
  ANDROID = 'android',
}

@Entity('push_tokens')
@Unique(['token'])
export class PushToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'varchar', length: 255 })
  token: string;

  @Column({ type: 'enum', enum: DevicePlatform })
  platform: DevicePlatform;

  @CreateDateColumn()
  createdAt: Date;
}
