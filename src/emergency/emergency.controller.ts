import { Controller, Post, Get, Body, Query, Param, Req, UseGuards } from '@nestjs/common';
import { EmergencyService } from './emergency.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('emergency')
export class EmergencyController {
  constructor(private readonly emergencyService: EmergencyService) {}

  // --- Screen 1: Alerts (SOS) ---
  @Post('sos')
  async initiateSOS(@Req() req: any, @Body() body: { lat: number; long: number }) {
    // Assuming req.user.id is available from AuthGuard
    return this.emergencyService.createSOS(req.user?.id, body.lat, body.long);
  }

  // --- Screen 2: Reporting (Map & List) ---
  @Get('incidents')
  async getIncidents() {
    return this.emergencyService.findAllIncidents();
  }

  // --- Screen 3: Tracking ---
  // Get tracking details for a specific Request ID (or the user's latest active request)
  @Get('tracking/latest')
  async getMyLatestTracking(@Req() req: any) {
    return this.emergencyService.trackUserLatestRequest(req.user?.id);
  }

  @Get('inventory')
  async getInventory(@Query('city') city: string) {
    // Default to Islamabad if no city provided
    return this.emergencyService.getLiveInventory(city || 'Islamabad');
  }
}