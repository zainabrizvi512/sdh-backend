import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NGO } from './ngo.entity';
import { NgoInventory } from './ngo-inventory.entity';
import { User } from 'src/users/user.entity';

@Injectable()
export class NgoService implements OnModuleInit {
  constructor(
    @InjectRepository(NGO)
    private ngoRepo: Repository<NGO>,
    @InjectRepository(NgoInventory) 
    private inventoryRepo: Repository<NgoInventory>,
    @InjectRepository(User) 
    private userRepo: Repository<User>,
  ) {}

  // --- AUTOMATIC SEEDING ---
  async onModuleInit() {
    await this.seedDummyNgos();
  }

  async seedDummyNgos() {
    const count = await this.ngoRepo.count();
    if (count > 0) return; // Don't seed if data exists

    console.log('🌱 Seeding NGOs & Inventory...');

    // 1. Create NGOs one by one so we can reference them immediately
    const edhi = await this.ngoRepo.save({ 
        name: 'Edhi Foundation', 
        type: 'Ambulance Service', 
        contactPhone: '115' 
    });
    
    const chhipa = await this.ngoRepo.save({ 
        name: 'Chhipa Welfare', 
        type: 'Rescue & Food', 
        contactPhone: '1020' 
    });
    
    const alKhidmat = await this.ngoRepo.save({ 
        name: 'Al-Khidmat Foundation', 
        type: 'General Relief', 
        contactPhone: '0800-111' 
    });
    
    const redCrescent = await this.ngoRepo.save({ 
        name: 'Red Crescent', 
        type: 'Medical Aid', 
        contactPhone: '1030' 
    });
    
    const rescue1122 = await this.ngoRepo.save({ 
        name: 'Rescue 1122', 
        type: 'Emergency Response', 
        contactPhone: '1122' 
    });

    // 2. Create Inventory Items linked to these NGOs
    // Notice how we reuse the variables (edhi, chhipa, etc.) in the 'ngo' field
    const inventoryItems = [
      // Edhi Inventory
      { itemName: 'Blankets', quantity: 120, city: 'Islamabad', ngo: edhi },
      { itemName: 'Food Packs', quantity: 50, city: 'Islamabad', ngo: edhi },
      
      // Chhipa Inventory
      { itemName: 'Food Packs', quantity: 200, city: 'Islamabad', ngo: chhipa }, 
      { itemName: 'Water (L)', quantity: 500, city: 'Islamabad', ngo: chhipa },

      // Al-Khidmat Inventory
      { itemName: 'Tents', quantity: 40, city: 'Islamabad', ngo: alKhidmat },
      { itemName: 'Blankets', quantity: 300, city: 'Islamabad', ngo: alKhidmat }, 

      // Red Crescent Inventory
      { itemName: 'First Aid Kits', quantity: 150, city: 'Islamabad', ngo: redCrescent },
      
      // Rescue 1122 Inventory
      { itemName: 'Life Jackets', quantity: 25, city: 'Islamabad', ngo: rescue1122 },
    ];

    await this.inventoryRepo.save(inventoryItems);
    
    console.log('✅ 5 Dummy NGOs and Live Inventory added!');
  }

  // --- CRUD METHODS ---

  async create(dto: any) {
    const ngo = this.ngoRepo.create(dto);
    return this.ngoRepo.save(ngo);
  }

  async findAll() {
    return this.ngoRepo.find({ where: { isActive: true } });
  }

  async joinNgo(userId: string, ngoId: string) {
    // A. Validate NGO exists
    const ngo = await this.ngoRepo.findOne({ where: { id: ngoId } });
    if (!ngo) throw new NotFoundException('NGO not found');

    // B. Update User record
    // We update the 'ngo' relation for this user
    await this.userRepo.update(userId, { ngo: ngo });

    return {
      success: true,
      message: `You have successfully joined ${ngo.name}`,
      ngo: ngo
    };
  }

  async getUserNgo(userId: string) {
    const user = await this.userRepo.findOne({
        where: { id: userId },
        relations: ['ngo']
    });
    return user?.ngo || null;
  }

  async findOne(id: string) {
    return this.ngoRepo.findOne({ where: { id } });
  }
}