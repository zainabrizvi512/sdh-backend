import { VolunteerActivityStatus } from '../volunteer-activity.entity';

export class CreateVolunteerActivityDto {
  title: string;
  category?: string;
  status?: VolunteerActivityStatus;
  xpReward?: number;
  livesImpacted?: number;
  startsAt?: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  metadata?: Record<string, any>;
}
