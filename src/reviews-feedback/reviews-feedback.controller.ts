import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { SubmitFeedbackDto } from './dto/submit-feedback.dto';
import { SubmitRatingDto } from './dto/submit-rating.dto';
import { SubmitTextFeedbackDto } from './dto/submit-text-feedback.dto';
import { UpdateFeedbackStatusDto } from './dto/update-feedback-status.dto';
import { FeedbackStatus } from './feedback-submission.entity';
import { ReviewsFeedbackService } from './reviews-feedback.service';

@UseGuards(JwtAuthGuard)
@Controller('reviews-feedback')
export class ReviewsFeedbackController {
  constructor(private readonly reviewsFeedbackService: ReviewsFeedbackService) { }

  @Post('rating')
  submitRating(@Req() req: any, @Body() dto: SubmitRatingDto) {
    return this.reviewsFeedbackService.submitRating(req.user?.sub, dto);
  }

  @Post('text')
  submitTextFeedback(@Req() req: any, @Body() dto: SubmitTextFeedbackDto) {
    return this.reviewsFeedbackService.submitTextFeedback(req.user?.sub, dto);
  }

  @Post('submit')
  submitFeedback(@Req() req: any, @Body() dto: SubmitFeedbackDto) {
    return this.reviewsFeedbackService.submitFeedback(req.user?.sub, dto);
  }

  @Get('recent')
  getRecentReviews(@Query('limit') limit?: string) {
    return this.reviewsFeedbackService.getRecentReviews(limit ? Number(limit) : 10);
  }

  @Get('admin/queue')
  getAdminQueue(@Query('status') status?: FeedbackStatus) {
    return this.reviewsFeedbackService.getAdminQueue(status);
  }

  @Patch('admin/:id/status')
  updateFeedbackStatus(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateFeedbackStatusDto) {
    return this.reviewsFeedbackService.updateFeedbackStatus(req.user?.sub, id, dto);
  }

  @Get('admin/report/weekly')
  getWeeklyReport() {
    return this.reviewsFeedbackService.getWeeklyReport();
  }
}
