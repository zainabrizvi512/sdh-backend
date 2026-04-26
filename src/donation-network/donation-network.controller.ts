import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { DonationNetworkService } from './donation-network.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { QuickDonateDto } from './dto/quick-donate.dto';
import { SendNgoChatMessageDto } from './dto/send-ngo-chat-message.dto';
import { CreateStoryDto } from './dto/create-story.dto';

@UseGuards(JwtAuthGuard)
@Controller('donation-network')
export class DonationNetworkController {
  constructor(private readonly donationNetworkService: DonationNetworkService) { }

  @Get('campaigns')
  getCampaignDirectory() {
    return this.donationNetworkService.getCampaignDirectory();
  }

  @Post('campaigns')
  createCampaign(@Body() dto: CreateCampaignDto) {
    return this.donationNetworkService.createCampaign(dto);
  }

  @Get('portal')
  getPortalSummary(@Req() req: any) {
    return this.donationNetworkService.getPortalSummary(req.user?.sub);
  }

  @Post('portal/donate')
  quickDonate(@Req() req: any, @Body() dto: QuickDonateDto) {
    return this.donationNetworkService.quickDonate(req.user?.sub, dto);
  }

  @Get('chat/contacts')
  listNgoChats() {
    return this.donationNetworkService.listNgoChats();
  }

  @Get('chat/:ngoId/messages')
  getNgoChatHistory(@Param('ngoId') ngoId: string) {
    return this.donationNetworkService.getNgoChatHistory(ngoId);
  }

  @Post('chat/messages')
  sendNgoMessage(@Req() req: any, @Body() dto: SendNgoChatMessageDto) {
    return this.donationNetworkService.sendNgoMessage(req.user?.sub, dto);
  }

  @Get('stories')
  getStories() {
    return this.donationNetworkService.getStories();
  }

  @Post('stories')
  createStory(@Req() req: any, @Body() dto: CreateStoryDto) {
    return this.donationNetworkService.createStory(req.user?.sub, dto);
  }
}
