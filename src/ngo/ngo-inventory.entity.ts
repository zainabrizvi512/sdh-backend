import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { NGO } from './ngo.entity';

@Entity('ngo_inventory')
export class NgoInventory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  itemName: string; // e.g., "Blankets", "Food Packs"

  @Column('int')
  quantity: number;

  @Column({ default: 'Islamabad' })
  city: string; // To filter inventory by user location

  @ManyToOne(() => NGO, { onDelete: 'CASCADE' })
  ngo: NGO;
}