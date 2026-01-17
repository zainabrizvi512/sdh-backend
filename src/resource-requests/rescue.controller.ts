import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { RescueService } from './rescue.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { CreateRequestDto } from './dto/create-request.dto';

@Controller('rescue')
export class RescueController {
  constructor(private readonly rescueService: RescueService) {}

  // --- Screen 1: New Request ---
  @Post('requests')
  async createRequest(@Body() dto: CreateRequestDto, @Req() req: any) {
    // Assuming 'req.user.id' comes from AuthGuard
    return this.rescueService.createRequest(req.user.id, dto);
  }

  // --- Screen 2: Allocation List ---
  @Get('allocations')
  async getAllocations() {
    return this.rescueService.findAllocations();
  }

  // --- Screen 3: Feedback ---
  @Post('feedback')
  async createFeedback(@Body() dto: CreateFeedbackDto, @Req() req: any) {
    return this.rescueService.submitFeedback(req.user.id, dto);
  }

  // --- Screen 4: Analytics Dashboard ---
  @Get('analytics')
  async getAnalytics() {
    return this.rescueService.getDashboardStats();
  }
}