import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { RiskService } from './risk.service';
import type { Server } from 'socket.io';
import { MessagesGateway } from 'src/messages/messages.gateway';

@Controller('risk')
export class RiskController {
  private io: Server;
  constructor(private readonly risk: RiskService, gateway: MessagesGateway) {
    this.io = gateway.server as Server;
  }

  @Post('signals')
  ingest(@Body() dto: any) { return this.risk.ingestSignal(dto); }

  @Post('refresh/:region')
  refresh(@Param('region') region: string) { return this.risk.refreshRegion(region, this.io); }

  @Get('latest/:region')
  latest(@Param('region') region: string) { return this.risk.latest(region); }
}
