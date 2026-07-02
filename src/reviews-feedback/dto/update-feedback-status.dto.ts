import { FeedbackStatus } from '../feedback-submission.entity';

export class UpdateFeedbackStatusDto {
  status: FeedbackStatus;
  note?: string;
}
