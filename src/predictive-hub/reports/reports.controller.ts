// src/predictive-hub/reports/reports.controller.ts
import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateHazardReportDto } from './create-hazard-report.dto';
import { MessagesGateway } from 'src/messages/messages.gateway';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import type { Server } from 'socket.io';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
    private io: Server;

    constructor(
        private readonly reports: ReportsService,
        gateway: MessagesGateway, // ✅ reuse your WS server
    ) {
        this.io = gateway.server as Server;
    }

    @Post('hazard')
    async create(@Req() req: any, @Body() dto: CreateHazardReportDto) {
        const userId = req.user?.sub;
        return this.reports.createHazardReport(userId, dto, this.io);
    }
}
