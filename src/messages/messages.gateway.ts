import {
    ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer,
} from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/send-message.dto';

// If you have a WS AuthGuard that sets socket.data.user.id
// @UseGuards(WsAuthGuard)
@WebSocketGateway({
    cors: true,
    namespace: '/chat',
})
export class MessagesGateway {
    @WebSocketServer() server: Server;

    constructor(private readonly messages: MessagesService) { }

    @SubscribeMessage('join')
    async onJoin(@ConnectedSocket() socket: Socket, @MessageBody() payload: { groupId: string }) {
        socket.join(`group:${payload.groupId}`);
        socket.emit('joined', { groupId: payload.groupId });
    }

    @SubscribeMessage('typing')
    async typing(@ConnectedSocket() socket: Socket, @MessageBody() payload: { groupId: string; isTyping: boolean }) {
        socket.to(`group:${payload.groupId}`).emit('typing', { userId: socket.data?.user?.id, ...payload });
    }

    @SubscribeMessage('send_message')
    async sendMessage(
        @ConnectedSocket() socket: Socket,
        @MessageBody() payload: { groupId: string; dto: SendMessageDto },
    ) {
        const uid = socket.data?.user?.id; // set by your WS auth
        const msg = await this.messages.sendMessage(uid, payload.groupId, payload.dto);
        this.server.to(`group:${payload.groupId}`).emit('new_message', msg);
        return msg;
    }
}
