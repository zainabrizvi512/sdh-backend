import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UsePipes, ValidationPipe } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/send-message.dto';
import { MarkReadDto } from './dto/mark-read.dto';

@Controller('groups/:groupId/messages')
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class MessagesController {
    constructor(private readonly messages: MessagesService) { }

    @Post()
    async send(@Req() req: any, @Param('groupId') groupId: string, @Body() dto: SendMessageDto) {
        const uid = req.user.id;
        const msg = await this.messages.sendMessage(uid, groupId, dto);
        return msg;
    }

    @Get()
    async list(
        @Req() req: any,
        @Param('groupId') groupId: string,
        @Query('limit') limit?: string,
        @Query('beforeId') beforeId?: string,
        @Query('afterId') afterId?: string,
    ) {
        const uid = req.user.id;
        return this.messages.listMessages(uid, groupId, {
            limit: limit ? Number(limit) : undefined,
            beforeId,
            afterId,
        });
    }

    @Post('read')
    async markRead(@Req() req: any, @Param('groupId') groupId: string, @Body() dto: MarkReadDto) {
        const uid = req.user.id;
        return this.messages.markRead(uid, groupId, dto);
    }

    @Patch(':messageId')
    async edit(@Req() req: any, @Param('messageId') messageId: string, @Body('text') text: string) {
        const uid = req.user.id;
        return this.messages.editMessage(uid, messageId, text);
    }

    @Delete(':messageId')
    async remove(@Req() req: any, @Param('messageId') messageId: string) {
        const uid = req.user.id;
        return this.messages.deleteMessage(uid, messageId);
    }
}
