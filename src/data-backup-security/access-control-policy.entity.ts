import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum AccessControlRole {
  ADMIN = 'ADMIN',
  SUPERVISOR = 'SUPERVISOR',
  FIELD_USER = 'FIELD_USER',
}

@Entity('access_control_policies')
export class AccessControlPolicy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: AccessControlRole, unique: true })
  role: AccessControlRole;

  @Column({ type: 'jsonb' })
  permissions: Record<string, boolean>;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
