import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RegisterTokenDto } from './dto/register-token.dto';
import { UnregisterTokenDto } from './dto/unregister-token.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { NotificationsService } from './notifications.service';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notifications: NotificationsService) { }

    @Post('token')
    registerToken(@Req() req: any, @Body() dto: RegisterTokenDto) {
        return this.notifications.registerToken(req.user.sub, dto);
    }

    @Delete('token')
    unregisterToken(@Req() req: any, @Body() dto: UnregisterTokenDto) {
        return this.notifications.unregisterToken(req.user.sub, dto.token);
    }

    @Get('preferences')
    getPreferences(@Req() req: any) {
        return this.notifications.getPreferences(req.user.sub);
    }

    @Patch('preferences')
    updatePreferences(@Req() req: any, @Body() dto: UpdatePreferencesDto) {
        return this.notifications.updatePreferences(req.user.sub, dto);
    }

    @Get()
    list(@Req() req: any, @Query('unreadOnly') unreadOnly?: string) {
        return this.notifications.listForUser(req.user.sub, unreadOnly === 'true');
    }

    @Get('unread-count')
    unreadCount(@Req() req: any) {
        return this.notifications.getUnreadCount(req.user.sub);
    }

    @Patch('read-all')
    markAllRead(@Req() req: any) {
        return this.notifications.markAllRead(req.user.sub);
    }

    @Patch(':id/read')
    markRead(@Req() req: any, @Param('id') id: string) {
        return this.notifications.markRead(req.user.sub, id);
    }
}
