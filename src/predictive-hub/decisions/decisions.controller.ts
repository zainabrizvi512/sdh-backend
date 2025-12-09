import { Controller, Get, Param } from '@nestjs/common';
import { DecisionsService } from './decisions.service';

@Controller('decisions')
export class DecisionsController {
  constructor(private readonly svc: DecisionsService) {}
  @Get(':region') recommend(@Param('region') region: string) { return this.svc.recommend(region); }
}
