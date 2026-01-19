import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { NgoInventory } from 'src/ngo/ngo-inventory.entity';
import { RiskSignal } from 'src/predictive-hub/risk/risk-signal.entity';
import { ResourceRequest } from 'src/resource-requests/resource_request.entity';
import { Repository } from 'typeorm';

@Injectable()
export class EmergencyService {
  constructor(
    @InjectRepository(RiskSignal)
    private riskRepo: Repository<RiskSignal>,
    @InjectRepository(ResourceRequest)
    private requestRepo: Repository<ResourceRequest>,
    @InjectRepository(NgoInventory)
    private inventoryRepo: Repository<NgoInventory>,
  ) {}

  // 1. SOS Logic
  async createSOS(userId: string, lat: number, long: number) {
    // Create a high-priority Risk Signal
    const sosSignal = this.riskRepo.create({
      source: 'USER_SOS',
      risk_type: 'SOS', // You might need to add this column or use existing 'type'
      region: 'Islamabad', // In real app, reverse-geocode lat/long to get city
      latitude: lat,
      longitude: long,
      score: 100, // Max urgency
      description: 'Emergency SOS Signal from User',
      createdAt: new Date()
    });
    
    // TODO: Trigger Notification to Admin/NGOs here
    return this.riskRepo.save(sosSignal);
  }

  // 2. Incident Map Logic
  async findAllIncidents() {
    // Fetches recent signals for the map
    return this.riskRepo.find({
      order: { createdAt: 'DESC' },
      take: 20 // Last 20 incidents
    });
  }

  // 3. Live Tracking Logic
  async trackUserLatestRequest(userId: string) {
    // Find the most recent request by this user
    const latestRequest = await this.requestRepo.findOne({
      where: { requester: { id: userId } },
      order: { createdAt: 'DESC' },
      relations: ['allocations', 'allocations.ngo']
    });

    if (!latestRequest) return null;

    // Determine overall status for the Progress Bar
    // Logic: If any allocation is DISPATCHED, the status is "In Transit"
    const activeAllocation = latestRequest.allocations.find(a => a.status === 'DISPATCHED' || a.status === 'ACTIVE');
    const completedAllocation = latestRequest.allocations.find(a => a.status === 'DELIVERED');

    let trackingStatus = 'Requested';
    let responderDetails = null;

    if (completedAllocation) {
      trackingStatus = 'Delivered';
      responderDetails = completedAllocation;
    } else if (activeAllocation) {
      trackingStatus = 'In Transit';
      responderDetails = activeAllocation;
    }

    return {
      requestId: latestRequest.id,
      status: trackingStatus, // "Requested", "In Transit", "Delivered"
      responder: responderDetails ? {
        vehicle: responderDetails.vehicleDetails, // "Ambulance #42"
        ngoName: responderDetails.ngo.name,
        statusLabel: 'Approaching' // Dynamic label based on geolocation math in future
      } : null
    };
  }

  async getLiveInventory(city: string) {
    // Sums up quantity by Item Name for the given city
    const result = await this.inventoryRepo
      .createQueryBuilder('inv')
      .select('inv.itemName', 'item')
      .addSelect('SUM(inv.quantity)', 'available')
    //   .where('inv.city = :city', { city })
      .groupBy('inv.itemName')
      .getRawMany();
      
    // result = [{ item: 'Blankets', available: '150' }, ...]
    return result;
  }

  // ... existing imports
  
  // NEW: Get Tracking for ALL user requests
  async trackUserRequests(userId: string) {
    // 1. Fetch last 10 requests for this user
    const requests = await this.requestRepo.find({
      where: { requester: { id: userId } },
      order: { createdAt: 'DESC' },
      take: 10,
      relations: ['allocations', 'allocations.ngo']
    });

    // 2. Map each request to the Tracking Status structure
    return requests.map(req => {
      // Logic to determine status for THIS specific request
      // 'PENDING', 'DISPATCHED', 'DELIVERED', 'CANCELLED'
      const activeAllocation = req.allocations.find(a => a.status === 'DISPATCHED' || a.status === 'PENDING');
      const completedAllocation = req.allocations.find(a => a.status === 'DELIVERED');

      let trackingStatus = 'Requested';
      let responderDetails = null;

      if (completedAllocation) {
        trackingStatus = 'Delivered';
        responderDetails = completedAllocation;
      } else if (activeAllocation) {
        trackingStatus = 'In Transit';
        responderDetails = activeAllocation;
      }

      return {
        requestId: req.id,
        resourceType: req.resourceType, // e.g. "Boats"
        quantity: req.quantity,
        createdAt: req.createdAt,
        status: trackingStatus, 
        responder: responderDetails ? {
          vehicle: responderDetails.vehicleDetails,
          ngoName: responderDetails.ngo.name,
          statusLabel: trackingStatus === 'Delivered' ? 'Arrived' : 'Approaching'
        } : null
      };
    });
  }
}