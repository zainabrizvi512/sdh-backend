import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NGO } from './ngo.entity';

@Injectable()
export class NgoService implements OnModuleInit {
  constructor(
    @InjectRepository(NGO)
    private ngoRepo: Repository<NGO>,
  ) {}

  // --- AUTOMATIC SEEDING ---
  async onModuleInit() {
    await this.seedDummyNgos();
  }

  async seedDummyNgos() {
    const count = await this.ngoRepo.count();
    if (count > 0) return; // Don't seed if data exists

    console.log('🌱 Seeding Dummy NGOs...');
    
    const dummyNgos = [
      { name: 'Edhi Foundation', type: 'Ambulance Service', contactPhone: '115' },
      { name: 'Chhipa Welfare', type: 'Rescue & Food', contactPhone: '1020' },
      { name: 'Al-Khidmat Foundation', type: 'General Relief', contactPhone: '0800-111' },
      { name: 'Red Crescent', type: 'Medical Aid', contactPhone: '1030' },
      { name: 'Rescue 1122', type: 'Emergency Response', contactPhone: '1122' },
    ];

    await this.ngoRepo.save(dummyNgos);
    console.log('✅ 5 Dummy NGOs added!');
  }

  // --- CRUD METHODS ---

  async create(dto: any) {
    const ngo = this.ngoRepo.create(dto);
    return this.ngoRepo.save(ngo);
  }

  async findAll() {
    return this.ngoRepo.find({ where: { isActive: true } });
  }

  async findOne(id: string) {
    return this.ngoRepo.findOne({ where: { id } });
  }
}