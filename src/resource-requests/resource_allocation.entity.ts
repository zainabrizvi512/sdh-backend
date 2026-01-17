import { User } from "src/users/user.entity";
import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn } from "typeorm";
import { ResourceRequest } from "./resource_request.entity";

@Entity('resource_allocations')
export class ResourceAllocation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ResourceRequest) // Links to the specific request
  request: ResourceRequest;

  @ManyToOne(() => User) // The NGO or Admin fulfilling the request
  provider: User; 
  
  @Column({ nullable: true })
  vehicleDetails: string; // e.g., "Edhi Ambulance"

  @Column({ default: 'ACTIVE' }) // ACTIVE, COMPLETED
  status: string;

  @CreateDateColumn()
  allocatedAt: Date;
}