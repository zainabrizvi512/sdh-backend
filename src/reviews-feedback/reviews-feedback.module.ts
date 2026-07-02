import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/user.entity';
import { FeedbackModerationEvent } from './feedback-moderation-event.entity';
import { FeedbackSubmission } from './feedback-submission.entity';
import { ReviewsFeedbackController } from './reviews-feedback.controller';
import { ReviewsFeedbackService } from './reviews-feedback.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, FeedbackSubmission, FeedbackModerationEvent])],
  controllers: [ReviewsFeedbackController],
  providers: [ReviewsFeedbackService],
  exports: [ReviewsFeedbackService],
})
export class ReviewsFeedbackModule { }
