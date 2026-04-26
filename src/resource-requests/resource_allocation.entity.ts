import { User } from "src/users/user.entity";
import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn } from "typeorm";
import { ResourceRequest } from "./resource_request.entity";
import { NGO } from "src/ngo/ngo.entity";

@Entity('resource_allocations')
export class ResourceAllocation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ResourceRequest) // Links to the specific request
  request: ResourceRequest;

  @ManyToOne(() => User) // The NGO or Admin fulfilling the request
  provider: User;

  @ManyToOne(() => NGO)
  ngo: NGO;

  @Column({ nullable: true })
  vehicleDetails: string; // e.g., "Edhi Ambulance"

  @Column({
    type: 'enum',
    enum: ['PENDING', 'DISPATCHED', 'DELIVERED', 'CANCELLED'], // DISPATCHED = "In Transit"
    default: 'PENDING'
  })
  status: string;

  @CreateDateColumn()
  allocatedAt: Date;
}