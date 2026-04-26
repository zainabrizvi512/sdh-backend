import { VolunteerActivityStatus } from '../volunteer-activity.entity';

export class UpdateVolunteerActivityStatusDto {
  status: VolunteerActivityStatus;
  livesImpacted?: number;
}
