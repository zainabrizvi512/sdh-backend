import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { NgoService } from './ngo.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('ngos')
export class NgoController {
  constructor(private readonly ngoService: NgoService) {}

  @Get()
  async getAllNgos() {
    return this.ngoService.findAll();
  }

  @Post()
  async createNgo(@Body() body: any) {
    return this.ngoService.create(body);
  }

  @Post(':id/join')
  async joinNgo(@Param('id') ngoId: string, @Req() req: any) {
    const userId = req.user?.id; 
    
    return this.ngoService.joinNgo(userId, ngoId);
  }

  @Get('my-ngo')
  async getMyNgo(@Req() req: any) {
      return this.ngoService.getUserNgo(req.user?.id);
  }
}