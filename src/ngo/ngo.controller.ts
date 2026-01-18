import { Controller, Get, Post, Body } from '@nestjs/common';
import { NgoService } from './ngo.service';

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
}