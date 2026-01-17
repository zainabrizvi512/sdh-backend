import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResourceRequest } from './resource_request.entity';
import { ResourceAllocation } from './resource_allocation.entity';
import { FieldReport } from './field_report.entity';

@Injectable()
export class RescueService {
  constructor(
    @InjectRepository(ResourceRequest)
    private requestRepo: Repository<ResourceRequest>,
    @InjectRepository(ResourceAllocation)
    private allocationRepo: Repository<ResourceAllocation>,
    @InjectRepository(FieldReport)
    private reportRepo: Repository<FieldReport>,
  ) {}

  // 1. Submit Request logic
  async createRequest(userId: string, dto: any) {
    const newRequest = this.requestRepo.create({
      ...dto,
      requester: { id: userId }, // Link to existing User entity
      status: 'PENDING'
    });
    return this.requestRepo.save(newRequest);
  }

  // 2. Allocation List logic
  async findAllocations() {
    // Returns data like: { provider: "Edhi", vehicle: "Ambulance", status: "Active" }
    return this.allocationRepo.find({
      relations: ['provider', 'request'],
      where: { status: 'ACTIVE' }
    });
  }

  // 3. Feedback logic
  async submitFeedback(userId: string, dto: any) {
    const feedback = this.reportRepo.create({
      observation: dto.observation,
      reporter: { id: userId }
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
}