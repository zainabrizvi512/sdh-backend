import { DonationMethod } from '../donation-transaction.entity';

export class QuickDonateDto {
  amount: number;
  ngoId?: string;
  campaignId?: string;
  method?: DonationMethod;
  currency?: string;
  note?: string;
}
