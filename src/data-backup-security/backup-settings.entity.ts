import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from 'src/users/user.entity';

@Entity('backup_settings')
export class BackupSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'boolean', default: true })
  encryptedStorageEnabled: boolean;

  @Column({ type: 'boolean', default: true })
  realtimeSyncEnabled: boolean;

  @Column({ type: 'int', default: 30 })
  syncIntervalSeconds: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
