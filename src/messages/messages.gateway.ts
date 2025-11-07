import {
    ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer,
} from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/send-message.dto';
import { WsAuthGuard } from 'src/auth/ws-auth.guard';

// If you have a WS AuthGuard that sets socket.data.user.id
@UseGuards(WsAuthGuard)
@WebSocketGateway({
    cors: true,
    namespace: '/chat',
})
export class MessagesGateway {
    @WebSocketServer() server: Server;

    constructor(private readonly messages: MessagesService) { }

    afterInit(server: Server) {
        console.log('[WS] /chat gateway initialised');
    }

    handleConnection(client: Socket) {
        console.log('[WS] client connected id=%s auth=%o', client.id, client.handshake.auth);
        // If you use guards, also log client.data after guard
    }

    handleDisconnect(client: Socket) {
        console.log('[WS] client disconnected id=%s', client.id);
    }

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
        console.log("Message Recieved", socket.data.user.sub);
        const uid = socket.data?.user?.sub; // set by your WS auth
        const msg = await this.messages.sendMessage(uid, payload.groupId, payload.dto);
        this.server.to(`group:${payload.groupId}`).emit('new_message', msg);
        return msg;
    }
}
