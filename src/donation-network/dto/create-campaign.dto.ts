export class CreateCampaignDto {
  title: string;
  causeCategory: string;
  description?: string;
  imageUrl?: string;
  goalAmount: number;
  startsAt?: string;
  endsAt?: string;
}
