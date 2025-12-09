import {
    ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer,
} from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/send-message.dto';
import { WsAuthGuard } from 'src/auth/ws-auth.guard';
import { MessageType } from './message.entity';

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
        const q = client.handshake.query as Partial<Record<'region' | 'groupId', string>>;
        const region = (q.region || '').trim();
        const groupId = (q.groupId || '').trim();
        if (region) client.join(`region:${region}`);
        if (groupId) client.join(`group:${groupId}`);
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
        socket.to(`group:${payload.groupId}`).emit('typing', { userId: socket.data?.user?.sub, ...payload });
    }

    @SubscribeMessage('send_message')
    async sendMessage(
        @ConnectedSocket() socket: Socket,
        @MessageBody() payload: { groupId: string; dto: SendMessageDto },
    ) {
        console.log('message received');
        const uid = socket.data?.user?.sub;
        console.log(uid, payload.groupId, payload.dto)
        const msg = await this.messages.sendMessage(uid, payload.groupId, payload.dto);
        this.server.to(`group:${payload.groupId}`).emit('new_message', msg);
        return msg;
    }

    @SubscribeMessage('start_live_location')
    async startLiveLocation(
        @ConnectedSocket() socket: Socket,
        @MessageBody() payload: { groupId: string; dto: SendMessageDto } // dto.type === LOCATION, dto.location{lat,lng,accuracy?}
    ) {
        const uid = socket.data?.user?.sub;
        // Persist the initial point as a message
        const msg = await this.messages.sendMessage(uid, payload.groupId, {
            ...payload.dto,
            type: MessageType.LOCATION,
        });
        this.server.to(`group:${payload.groupId}`).emit('new_message', msg);
        return msg;
    }

    @SubscribeMessage('live_location_update')
    async liveLocationUpdate(
        @ConnectedSocket() socket: Socket,
        @MessageBody() payload: { groupId: string; dto: SendMessageDto } // dto.type === LOCATION
    ) {
        const uid = socket.data?.user?.sub;

        // Server-side throttle (5s by default)
        const accepted = this.messages.acceptLocationUpdate(uid, 5000);
        if (!accepted) return;

        // Persist/update: simplest is persisting each as a message
        const msg = await this.messages.sendMessage(uid, payload.groupId, {
            ...payload.dto,
            type: MessageType.LOCATION,
        });

        this.server.to(`group:${payload.groupId}`).emit('new_message', msg);
        return msg;

        // If you prefer ephemeral pings instead of messages:
        // this.server.to(`group:${payload.groupId}`).emit('live_location_ping', {
        //   userId: uid,
        //   groupId: payload.groupId,
        //   location: payload.dto.location,
        //   ts: Date.now(),
        // });
        // return { ok: true };
    }

    @SubscribeMessage('stop_live_location')
    async stopLiveLocation(
        @ConnectedSocket() socket: Socket,
        @MessageBody() payload: { groupId: string }
    ) {
        const uid = socket.data?.user?.sub;
        // Optionally persist a system message; here we just notify
        this.server.to(`group:${payload.groupId}`).emit('live_location_stopped', {
            userId: uid,
            groupId: payload.groupId,
            ts: Date.now(),
        });
        return { ok: true };
    }
}
