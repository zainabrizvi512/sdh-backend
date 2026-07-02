import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';
import { RequestSessionDto } from './dto/request-session.dto';
import { MentalHealthSupportService } from './mental-health-support.service';
import { SelfHelpResourceType } from './self-help-resource.entity';

@UseGuards(JwtAuthGuard)
@Controller('mental-health')
export class MentalHealthSupportController {
  constructor(private readonly mentalHealthService: MentalHealthSupportService) { }

  @Get('professionals')
  listProfessionals() {
    return this.mentalHealthService.listProfessionals();
  }

  @Post('sessions/request')
  requestSession(@Req() req: any, @Body() dto: RequestSessionDto) {
    return this.mentalHealthService.requestSession(req.user?.sub, dto);
  }

  @Get('sessions/my')
  getMySessions(@Req() req: any) {
    return this.mentalHealthService.getMySessions(req.user?.sub);
  }

  @Get('self-help/resources')
  listSelfHelpResources(@Query('type') type?: SelfHelpResourceType) {
    return this.mentalHealthService.listSelfHelpResources(type);
  }

  @Post('self-help/journal-entries')
  createJournalEntry(@Req() req: any, @Body() dto: CreateJournalEntryDto) {
    return this.mentalHealthService.createJournalEntry(req.user?.sub, dto);
  }

  @Get('ngos')
  listNgos() {
    return this.mentalHealthService.listNgos();
  }

  @Get('stress-tips')
  listStressTips() {
    return this.mentalHealthService.listStressTips();
  }
}
