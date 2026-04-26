import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { EngagementHubService } from './engagement-hub.service';
import { CreateVolunteerActivityDto } from './dto/create-volunteer-activity.dto';
import { UpdateVolunteerActivityStatusDto } from './dto/update-volunteer-activity-status.dto';
import { VolunteerActivityStatus } from './volunteer-activity.entity';
import { CreateOpportunityDto } from './dto/create-opportunity.dto';
import { OpportunitiesQueryDto } from './dto/opportunities.query.dto';

@UseGuards(JwtAuthGuard)
@Controller('engagement-hub')
export class EngagementHubController {
  constructor(private readonly engagementHubService: EngagementHubService) { }

  @Get('dashboard')
  getDashboard(@Req() req: any) {
    return this.engagementHubService.getDashboard(req.user?.sub);
  }

  @Get('activities')
  listActivities(@Req() req: any, @Query('status') status?: VolunteerActivityStatus) {
    return this.engagementHubService.listActivities(req.user?.sub, status);
  }

  @Post('activities')
  createActivity(@Req() req: any, @Body() dto: CreateVolunteerActivityDto) {
    return this.engagementHubService.createActivity(req.user?.sub, dto);
  }

  @Patch('activities/:id/status')
  updateActivityStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateVolunteerActivityStatusDto,
  ) {
    return this.engagementHubService.updateActivityStatus(req.user?.sub, id, dto);
  }

  @Get('history')
  getHistory(@Req() req: any) {
    return this.engagementHubService.getHistory(req.user?.sub);
  }

  @Post('opportunities')
  createOpportunity(@Body() dto: CreateOpportunityDto) {
    return this.engagementHubService.createOpportunity(dto);
  }

  @Get('opportunities')
  getOpportunities(@Req() req: any, @Query() query: OpportunitiesQueryDto) {
    return this.engagementHubService.getGeoOpportunities(
      req.user?.sub,
      query.latitude !== undefined ? Number(query.latitude) : undefined,
      query.longitude !== undefined ? Number(query.longitude) : undefined,
      query.radiusKm !== undefined ? Number(query.radiusKm) : undefined,
    );
  }
}
