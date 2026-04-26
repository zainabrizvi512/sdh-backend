import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { AidNetworkService } from './aid-network.service';

@Controller('emergency-aid')
export class AidNetworkController {
    constructor(private readonly aidService: AidNetworkService) {}

    @Post('sos')
    async sendAlert(@Body() dto: { userId: string; lat: number; lng: number }) 
    {
        return await this.aidService.triggerEmergencySOS(dto.userId, dto.lat, dto.lng);
    }

    @Get('volunteer-stock')
    async getStock(@Query('city') city: string) 
    {
        return await this.aidService.getVolunteerStock(city);
    }
    
    @Get('incident-map')
    async getNearbyIncidents(@Query('lat') lat: number, @Query('lng') lng: number) {
        return [];
    }
    
}