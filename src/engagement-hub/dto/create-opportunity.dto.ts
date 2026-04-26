export class CreateOpportunityDto {
  title: string;
  description?: string;
  city?: string;
  latitude: number;
  longitude: number;
  radiusKm?: number;
  xpReward?: number;
  startsAt?: string;
  expiresAt?: string;
}
