import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResourceRequest } from './resource_request.entity';
import { ResourceAllocation } from './resource_allocation.entity';
import { FieldReport } from './field_report.entity';
import { CreateRequestDto } from './dto/create-request.dto';
import { User } from 'src/users/user.entity';
import { NGO } from 'src/ngo/ngo.entity';

@Injectable()
export class RescueService {
  constructor(
    @InjectRepository(ResourceRequest)
    private requestRepo: Repository<ResourceRequest>,
    @InjectRepository(ResourceAllocation)
    private allocationRepo: Repository<ResourceAllocation>,
    @InjectRepository(FieldReport)
    private reportRepo: Repository<FieldReport>,
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    @InjectRepository(NGO)
    private ngoRepo: Repository<NGO>,
  ) { }

  // 1. Submit Request logic
  async createRequest(userId: string, dto: CreateRequestDto) {
    const user = await this.usersRepo.findOne({ where: { sub: userId } });
    if (!user) {
      throw new Error('User not found');
    }
    const newRequest = await this.requestRepo.create({
      ...dto,
      requester: { id: user.id }, // Link to existing User entity
      status: 'PENDING'
    });

    const savedRequest = await this.requestRepo.save(newRequest);

    // 2. Dynamic Allocation Logic (Auto-assign NGO)
    await this.autoAllocateToNgo(savedRequest);

    return this.requestRepo.findOne({
      where: { id: savedRequest.id },
      relations: ['allocations', 'allocations.ngo'] // Return with allocation details
    });
  }

  // --- HELPER FUNCTION: AUTO ALLOCATION ---
  private async autoAllocateToNgo(request: ResourceRequest) {
    // A. Fetch all active NGOs
    const ngos = await this.ngoRepo.find({ where: { isActive: true } });

    if (ngos.length === 0) {
      console.warn("⚠️ No NGOs available for auto-allocation.");
      return;
    }

    // B. Pick a random NGO (Simulating a "Smart Matching" algorithm)
    const randomNgo = ngos[Math.floor(Math.random() * ngos.length)];

    // C. Create the Allocation Record
    const allocation = this.allocationRepo.create({
      request: request,
      ngo: randomNgo,
      status: 'ACTIVE',
      vehicleDetails: `${randomNgo.name} Vehicle #${Math.floor(Math.random() * 100)}` // Dummy vehicle ID
    });
    await this.allocationRepo.save(allocation);

    // D. Update Request Status
    request.status = 'ALLOCATED';
    await this.requestRepo.save(request);

    console.log(`✅ Auto-allocated Request ${request.id} to ${randomNgo.name}`);
  }

  // 2. Allocation List logic
  async findAllocations() {
    const allocations = await this.allocationRepo.find({
      // 1. Fetch 'ngo' (not provider) and 'request' relations
      relations: ['ngo', 'request'], 
      where: { status: 'PENDING' },
      order: { allocatedAt: 'DESC' }
    });

    // 2. Map the results to a cleaner format for the Frontend
    return allocations.map(allocation => ({
      id: allocation.id,
      status: allocation.status,
      vehicleDetails: allocation.vehicleDetails,
      allocatedAt: allocation.allocatedAt,
      // Flatten NGO Name
      ngoName: allocation.ngo ? allocation.ngo.name : 'Unknown NGO',
      ngoIcon: allocation.ngo ? allocation.ngo.logoUrl : null,
      // Flatten Resource Type so it's easy to show in the subtitle
      resourceType: allocation.request ? allocation.request.resourceType : 'General Aid',
      quantity: allocation.request ? allocation.request.quantity : 0,
    }));
  }

  // 3. Feedback logic
  async submitFeedback(userId: string, dto: any) {
    const user = await this.usersRepo.findOne({ where: { sub: userId } });
    if (!user) {
      throw new Error('User not found');
    }
    const feedback = this.reportRepo.create({
      observation: dto.observation,
      reporter: { id: user.id }
    });
    return this.reportRepo.save(feedback);
  }

  // 4. Analytics logic
  async getDashboardStats() {
    // "Aid Sent" = Total Allocations or Completed Requests
    const aidSentCount = await this.allocationRepo.count();

    // "Success %" = (Completed Requests / Total Requests) * 100
    const totalRequests = await this.requestRepo.count();
    const completedRequests = await this.requestRepo.count({ where: { status: 'COMPLETED' } });

    const successRate = totalRequests === 0 ? 0 : Math.round((completedRequests / totalRequests) * 100);

    return {
      aidSent: aidSentCount,
      successRate: successRate
    };
  }

  async updateAllocationStatus(allocationId: string, status: 'DISPATCHED' | 'DELIVERED') {
    const allocation = await this.allocationRepo.findOne({
      where: { id: allocationId },
      relations: ['request']
    });

    if (!allocation) throw new Error('Allocation not found');

    // 1. Update the Driver/Allocation Status
    allocation.status = status;
    await this.allocationRepo.save(allocation);

    // 2. If Delivered, mark the User's Request as COMPLETED
    if (status === 'DELIVERED') {
      allocation.request.status = 'COMPLETED';
      await this.requestRepo.save(allocation.request);
    }

    return allocation;
  }
}