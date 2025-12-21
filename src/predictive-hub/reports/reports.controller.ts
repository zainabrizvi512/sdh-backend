// src/predictive-hub/reports/reports.controller.ts
import { Body, Controller, Post } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateHazardReportDto } from './create-hazard-report.dto';
import { MessagesGateway } from 'src/messages/messages.gateway';
import type { Server } from 'socket.io';

// ✅ use your existing auth decorator/guard
// Example: @UseGuards(AuthGuard) and @Req() user
// Here I assume you can read user id from req.user.sub
import { Req } from '@nestjs/common';

@Controller('reports')
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
        console.log("✅ /reports/hazard HIT", dto);
        const userId = req.user?.sub;
        console.log("✅ userId:", userId);

        return this.reports.createHazardReport(userId, dto, this.io);
    }
}
