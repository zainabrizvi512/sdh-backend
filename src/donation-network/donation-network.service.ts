import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { NGO } from 'src/ngo/ngo.entity';
import { NgoMessage } from 'src/ngo-chat/ngo-message.entity';
import { NgoChatService } from 'src/ngo-chat/ngo-chat.service';
import { User } from 'src/users/user.entity';
import { In, Repository } from 'typeorm';
import { CommunityStory } from './community-story.entity';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { CreateStoryDto } from './dto/create-story.dto';
import { QuickDonateDto } from './dto/quick-donate.dto';
import { SendNgoChatMessageDto } from './dto/send-ngo-chat-message.dto';
import { DonationCampaign, DonationCampaignStatus } from './donation-campaign.entity';
import { DonationMethod, DonationTransaction } from './donation-transaction.entity';

@Injectable()
export class DonationNetworkService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(NGO)
    private readonly ngoRepo: Repository<NGO>,
    @InjectRepository(NgoMessage)
    private readonly ngoMsgRepo: Repository<NgoMessage>,
    @InjectRepository(DonationCampaign)
    private readonly campaignsRepo: Repository<DonationCampaign>,
    @InjectRepository(DonationTransaction)
    private readonly donationsRepo: Repository<DonationTransaction>,
    @InjectRepository(CommunityStory)
    private readonly storiesRepo: Repository<CommunityStory>,
    private readonly ngoChatService: NgoChatService,
  ) { }

  private async getUserBySub(sub: string): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { sub } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async createCampaign(dto: CreateCampaignDto) {
    if (!dto.title?.trim()) throw new BadRequestException('title is required');
    if (!dto.causeCategory?.trim()) throw new BadRequestException('causeCategory is required');
    if (!dto.goalAmount || dto.goalAmount <= 0) throw new BadRequestException('goalAmount must be greater than 0');

    const campaign = this.campaignsRepo.create({
      title: dto.title.trim(),
      causeCategory: dto.causeCategory.trim().toUpperCase(),
      description: dto.description?.trim(),
      imageUrl: dto.imageUrl?.trim(),
      goalAmount: dto.goalAmount,
      raisedAmount: 0,
      status: DonationCampaignStatus.ACTIVE,
      startsAt: dto.startsAt ? new Date(dto.startsAt) : new Date(),
      endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
    });

    return this.campaignsRepo.save(campaign);
  }

  async getCampaignDirectory() {
    const campaigns = await this.campaignsRepo.find({
      where: { status: In([DonationCampaignStatus.ACTIVE, DonationCampaignStatus.PAUSED]) },
      order: { createdAt: 'DESC' },
    });

    return {
      campaigns: campaigns.map((campaign) => {
        const goal = Number(campaign.goalAmount ?? 0);
        const raised = Number(campaign.raisedAmount ?? 0);
        const fundedPercent = goal <= 0 ? 0 : Math.min(100, Math.round((raised / goal) * 100));
        return {
          id: campaign.id,
          title: campaign.title,
          causeCategory: campaign.causeCategory,
          description: campaign.description ?? null,
          imageUrl: campaign.imageUrl ?? null,
          goalAmount: goal,
          raisedAmount: raised,
          fundedPercent,
          status: campaign.status,
          startsAt: campaign.startsAt ?? null,
          endsAt: campaign.endsAt ?? null,
        };
      }),
    };
  }

  async quickDonate(sub: string, dto: QuickDonateDto) {
    const donor = await this.getUserBySub(sub);
    if (!dto.amount || dto.amount <= 0) throw new BadRequestException('amount must be greater than 0');

    let ngo: NGO | undefined;
    if (dto.ngoId) {
      ngo = await this.ngoRepo.findOne({ where: { id: dto.ngoId, isActive: true } }) as NGO | undefined;
      if (!ngo) throw new NotFoundException('NGO not found');
    }

    let campaign: DonationCampaign | undefined;
    if (dto.campaignId) {
      campaign = await this.campaignsRepo.findOne({ where: { id: dto.campaignId } }) as DonationCampaign | undefined;
      if (!campaign) throw new NotFoundException('Campaign not found');
      if (campaign.status !== DonationCampaignStatus.ACTIVE) {
        throw new BadRequestException('Campaign is not active');
      }
      campaign.raisedAmount = Number(campaign.raisedAmount) + Number(dto.amount);
      if (Number(campaign.raisedAmount) >= Number(campaign.goalAmount)) {
        campaign.status = DonationCampaignStatus.COMPLETED;
      }
      await this.campaignsRepo.save(campaign);
    }

    const donation = this.donationsRepo.create({
      donor,
      ngo,
      campaign,
      amount: dto.amount,
      method: dto.method ?? DonationMethod.CARD,
      currency: (dto.currency ?? 'USD').toUpperCase(),
      isSuccessful: true,
      note: dto.note?.trim(),
    });
    const saved = await this.donationsRepo.save(donation);

    return {
      donationId: saved.id,
      amount: Number(saved.amount),
      currency: saved.currency,
      method: saved.method,
      campaignId: campaign?.id ?? null,
      ngoId: ngo?.id ?? null,
      status: 'SUCCESS',
      donatedAt: saved.createdAt,
    };
  }

  async listNgoChats() {
    const ngos = await this.ngoRepo.find({ where: { isActive: true }, order: { createdAt: 'ASC' } });
    return {
      contacts: ngos.map((ngo) => ({
        ngoId: ngo.id,
        name: ngo.name,
        isOnline: true,
        logoUrl: ngo.logoUrl ?? null,
      })),
    };
  }

  async getNgoChatHistory(ngoId: string) {
    const ngo = await this.ngoRepo.findOne({ where: { id: ngoId } });
    if (!ngo) throw new NotFoundException('NGO not found');

    const messages = await this.ngoChatService.getRecentMessages(ngoId);
    return {
      ngo: { id: ngo.id, name: ngo.name },
      messages: messages
        .slice()
        .reverse()
        .map((m) => ({
          id: m.id,
          text: m.text,
          senderName: m.sender?.name ?? m.sender?.username ?? m.sender?.email ?? 'Volunteer',
          sentAt: m.createdAt,
        })),
    };
  }

  async sendNgoMessage(sub: string, dto: SendNgoChatMessageDto) {
    if (!dto.ngoId) throw new BadRequestException('ngoId is required');
    if (!dto.text?.trim()) throw new BadRequestException('text is required');

    const ngo = await this.ngoRepo.findOne({ where: { id: dto.ngoId } });
    if (!ngo) throw new NotFoundException('NGO not found');

    const msg = await this.ngoChatService.saveMessage(sub, dto.ngoId, dto.text.trim());
    return {
      id: msg.id,
      ngoId: dto.ngoId,
      text: msg.text,
      senderId: msg.sender?.id ?? null,
      sentAt: msg.createdAt,
    };
  }

  async createStory(sub: string, dto: CreateStoryDto) {
    if (!dto.content?.trim()) throw new BadRequestException('content is required');
    const user = await this.getUserBySub(sub);

    const story = this.storiesRepo.create({
      author: user,
      authorDisplayName: user.name ?? user.username ?? user.email,
      content: dto.content.trim(),
      imageUrl: dto.imageUrl?.trim(),
    });

    return this.storiesRepo.save(story);
  }

  async getStories() {
    const stories = await this.storiesRepo.find({ order: { createdAt: 'DESC' }, take: 100 });
    return {
      stories: stories.map((story) => ({
        id: story.id,
        authorDisplayName: story.authorDisplayName,
        content: story.content,
        imageUrl: story.imageUrl ?? null,
        likesCount: story.likesCount,
        createdAt: story.createdAt,
      })),
    };
  }

  async getPortalSummary(sub: string) {
    const user = await this.getUserBySub(sub);
    const donations = await this.donationsRepo.find({
      where: { donor: { id: user.id }, isSuccessful: true },
      order: { createdAt: 'DESC' },
      take: 20,
      relations: ['campaign', 'ngo'],
    });

    const totalDonated = donations.reduce((sum, d) => sum + Number(d.amount), 0);
    return {
      donor: {
        id: user.id,
        name: user.name ?? user.username ?? user.email,
      },
      totalDonated: Number(totalDonated.toFixed(2)),
      donationsCount: donations.length,
      recentDonations: donations.map((d) => ({
        id: d.id,
        amount: Number(d.amount),
        currency: d.currency,
        ngoName: d.ngo?.name ?? null,
        campaignTitle: d.campaign?.title ?? null,
        donatedAt: d.createdAt,
      })),
    };
  }
}
