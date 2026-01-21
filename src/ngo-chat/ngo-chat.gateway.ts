import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NgoChatService } from './ngo-chat.service';
import { UseGuards } from '@nestjs/common';
import { WsAuthGuard } from '../auth/ws-auth.guard'; // Use your existing WS Guard

@UseGuards(WsAuthGuard)
@WebSocketGateway({ namespace: '/ngo-hub', cors: true }) // Separate Namespace
export class NgoChatGateway {
  @WebSocketServer() server: Server;

  constructor(private readonly chatService: NgoChatService) {}

  // 1. Join the Room for the specific NGO
  @SubscribeMessage('join_ngo')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { ngoId: string },
  ) {
    console.log(`User ${client.data.user.sub} joining NGO room: ${payload.ngoId}`);
    client.join(`ngo_${payload.ngoId}`);
    
    // Optional: Send recent history upon join
    this.chatService.getRecentMessages(payload.ngoId).then((msgs) => {
      client.emit('history', msgs);
    });
  }

  // 2. Handle Sending Messages
  @SubscribeMessage('send_ngo_message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { ngoId: string; text: string },
  ) {
    const userId = client.data.user.sub;
    
    // Save to DB
    const savedMsg = await this.chatService.saveMessage(userId, payload.ngoId, payload.text);

    // Broadcast to everyone in that NGO room
    this.server.to(`ngo_${payload.ngoId}`).emit('new_message', savedMsg);
  }
}