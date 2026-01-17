import { User } from "src/users/user.entity";
import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn } from "typeorm";

@Entity('field_reports')
export class FieldReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User) // The user sending feedback
  reporter: User;

  @Column('text')
  observation: string; // "Enter observations..."

  @CreateDateColumn()
  createdAt: Date;
}