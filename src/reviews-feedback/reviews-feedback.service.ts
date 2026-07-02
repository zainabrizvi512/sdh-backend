import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/user.entity';
import { Between, Repository } from 'typeorm';
import { SubmitFeedbackDto } from './dto/submit-feedback.dto';
import { SubmitRatingDto } from './dto/submit-rating.dto';
import { SubmitTextFeedbackDto } from './dto/submit-text-feedback.dto';
import { UpdateFeedbackStatusDto } from './dto/update-feedback-status.dto';
import { FeedbackModerationEvent } from './feedback-moderation-event.entity';
import { FeedbackStatus, FeedbackSubmission } from './feedback-submission.entity';

const FLAG_KEYWORDS = ['urgent', 'broken', 'fail', 'unsafe', 'critical', 'bug'];

@Injectable()
export class ReviewsFeedbackService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(FeedbackSubmission)
    private readonly feedbackRepo: Repository<FeedbackSubmission>,
    @InjectRepository(FeedbackModerationEvent)
    private readonly moderationRepo: Repository<FeedbackModerationEvent>,
  ) { }

  private async getUserBySub(sub: string): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { sub } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  private classifyFeedback(comment?: string): FeedbackStatus {
    if (!comment) return FeedbackStatus.PENDING;
    const lower = comment.toLowerCase();
    return FLAG_KEYWORDS.some((kw) => lower.includes(kw)) ? FeedbackStatus.FLAGGED : FeedbackStatus.PENDING;
  }

  private formatSubmission(f: FeedbackSubmission) {
    const label = f.isAnonymous
      ? 'Anonymous'
      : (f.submitterLabel ?? f.user?.name ?? f.user?.username ?? 'User');

    return {
      id: f.id,
      rating: f.rating ?? null,
      comment: f.comment ?? null,
      isAnonymous: f.isAnonymous,
      status: f.status,
      submitterLabel: label,
      createdAt: f.createdAt,
    };
  }

  async submitRating(sub: string, dto: SubmitRatingDto) {
    if (!dto.rating || dto.rating < 1 || dto.rating > 5) {
      throw new BadRequestException('rating must be between 1 and 5');
    }

    const user = await this.getUserBySub(sub);
    const feedback = this.feedbackRepo.create({
      user: dto.isAnonymous ? undefined : user,
      rating: dto.rating,
      isAnonymous: dto.isAnonymous ?? false,
      submitterLabel: dto.isAnonymous ? 'Anonymous' : (user.name ?? user.username ?? 'User'),
      status: FeedbackStatus.PENDING,
    });

    const saved = await this.feedbackRepo.save(feedback);
    return { ...this.formatSubmission(saved), message: 'Rating saved' };
  }

  async submitTextFeedback(sub: string, dto: SubmitTextFeedbackDto) {
    if (!dto.comment?.trim()) throw new BadRequestException('comment is required');

    const user = await this.getUserBySub(sub);
    const status = this.classifyFeedback(dto.comment);
    const feedback = this.feedbackRepo.create({
      user: dto.isAnonymous ? undefined : user,
      comment: dto.comment.trim(),
      isAnonymous: dto.isAnonymous ?? false,
      submitterLabel: dto.isAnonymous ? 'Anonymous' : (user.name ?? user.username ?? 'User'),
      status,
    });

    const saved = await this.feedbackRepo.save(feedback);
    return { ...this.formatSubmission(saved), message: 'Text feedback saved' };
  }

  async submitFeedback(sub: string, dto: SubmitFeedbackDto) {
    if (!dto.rating && !dto.comment?.trim()) {
      throw new BadRequestException('rating or comment is required');
    }
    if (dto.rating !== undefined && (dto.rating < 1 || dto.rating > 5)) {
      throw new BadRequestException('rating must be between 1 and 5');
    }

    const user = await this.getUserBySub(sub);
    const status = this.classifyFeedback(dto.comment);
    const feedback = this.feedbackRepo.create({
      user: dto.isAnonymous ? undefined : user,
      rating: dto.rating,
      comment: dto.comment?.trim(),
      isAnonymous: dto.isAnonymous ?? false,
      submitterLabel: dto.isAnonymous ? 'Anonymous' : (user.name ?? user.username ?? 'User'),
      status,
    });

    const saved = await this.feedbackRepo.save(feedback);
    return { ...this.formatSubmission(saved), message: 'Feedback submitted' };
  }

  async getRecentReviews(limit = 10) {
    const items = await this.feedbackRepo.find({
      where: { status: FeedbackStatus.APPROVED },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: Math.min(limit, 50),
    });

    return { reviews: items.map((f) => this.formatSubmission(f)) };
  }

  async getAdminQueue(status?: FeedbackStatus) {
    const where = status ? { status } : {};
    const items = await this.feedbackRepo.find({
      where,
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: 100,
    });

    const pendingCount = await this.feedbackRepo.count({ where: { status: FeedbackStatus.PENDING } });
    const flaggedCount = await this.feedbackRepo.count({ where: { status: FeedbackStatus.FLAGGED } });

    return {
      pipeline: ['collect', 'classify', 'escalate', 'report'],
      summary: {
        pendingCount,
        flaggedCount,
        newEntriesLabel: `${pendingCount} new entries`,
        flaggedLabel: `${flaggedCount} flagged high priority`,
      },
      queue: items.map((f) => this.formatSubmission(f)),
    };
  }

  async updateFeedbackStatus(sub: string, id: string, dto: UpdateFeedbackStatusDto) {
    if (!dto.status) throw new BadRequestException('status is required');

    const actor = await this.getUserBySub(sub);
    const feedback = await this.feedbackRepo.findOne({ where: { id }, relations: ['user'] });
    if (!feedback) throw new NotFoundException('Feedback not found');

    feedback.status = dto.status;
    await this.feedbackRepo.save(feedback);

    await this.moderationRepo.save(
      this.moderationRepo.create({
        feedback,
        actor,
        action: dto.status,
        note: dto.note?.trim(),
      }),
    );

    return { ...this.formatSubmission(feedback), message: `Feedback marked as ${dto.status}` };
  }

  async getWeeklyReport() {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);

    const weekFeedback = await this.feedbackRepo.find({
      where: { createdAt: Between(weekStart, now) },
    });

    const rated = weekFeedback.filter((f) => f.rating !== null && f.rating !== undefined);
    const csatScore = rated.length === 0
      ? 0
      : Math.round((rated.reduce((sum, f) => sum + (f.rating ?? 0), 0) / rated.length) * 10) / 10;

    const pendingCount = weekFeedback.filter((f) => f.status === FeedbackStatus.PENDING).length;
    const flaggedCount = weekFeedback.filter((f) => f.status === FeedbackStatus.FLAGGED).length;
    const positiveCount = rated.filter((f) => (f.rating ?? 0) >= 4).length;
    const negativeCount = rated.filter((f) => (f.rating ?? 0) <= 2).length;

    let sentimentSummary = 'Neutral sentiment this week';
    if (positiveCount > negativeCount * 2) sentimentSummary = 'Positive CSAT trend with strong satisfaction';
    else if (negativeCount > positiveCount) sentimentSummary = 'Mixed sentiment — attention needed on low ratings';

    return {
      weekStart,
      weekEnd: now,
      csatScore,
      sentimentSummary,
      pendingCount,
      flaggedCount,
      totalSubmissions: weekFeedback.length,
      reportReady: true,
      displayLabel: 'CSAT trend + sentiment summary available',
    };
  }
}
