import { Controller, Get, Post, Body, Req, UseGuards, Param } from '@nestjs/common';
import { RescueService } from './rescue.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { CreateRequestDto } from './dto/create-request.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('rescue')
export class RescueController {
  constructor(private readonly rescueService: RescueService) { }

  // --- Screen 1: New Request ---
  @Post('requests')
  async createRequest(@Body() dto: CreateRequestDto, @Req() req: any) {
    // Assuming 'req.user.id' comes from AuthGuard
    const currentUserId = req.user.sub;
    console.log("userId", currentUserId, req.user, dto);
    return this.rescueService.createRequest(currentUserId, dto);
  }

  // --- Screen 2: Allocation List ---
  @Get('allocations')
  async getAllocations() {
    return this.rescueService.findAllocations();
  }

  // --- Screen 3: Feedback ---
  @Post('feedback')
  async createFeedback(@Body() dto: CreateFeedbackDto, @Req() req: any) {
    const currentUserId = req.user.sub;
    return this.rescueService.submitFeedback(currentUserId, dto);
  }

  // --- Screen 4: Analytics Dashboard ---
  @Get('analytics')
  async getAnalytics() {
    return this.rescueService.getDashboardStats();
  }

  @Post('allocations/:id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: 'DISPATCHED' | 'DELIVERED' }
  ) {
    return this.rescueService.updateAllocationStatus(id, body.status);
  }
}