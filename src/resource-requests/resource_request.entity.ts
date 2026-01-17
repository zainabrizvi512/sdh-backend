import { User } from "src/users/user.entity";
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from "typeorm";

@Entity('resource_requests')
export class ResourceRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  resourceType: string; // e.g., "Ambulance", "Food", "Boats"

  @Column()
  quantity: number;

  @Column({
    type: 'enum',
    enum: ['PENDING', 'ALLOCATED', 'COMPLETED', 'CANCELLED'],
    default: 'PENDING'
  })
  status: string;

  @ManyToOne(() => User) // The user requesting aid
  requester: User;

  @CreateDateColumn()
  createdAt: Date;
}