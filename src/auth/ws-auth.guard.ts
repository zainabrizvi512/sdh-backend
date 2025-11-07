// src/auth/ws-auth.guard.ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { verifyJwt } from './verifyJWT';

@Injectable()
export class WsAuthGuard implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const client: Socket = context.switchToWs().getClient<Socket>();

        const token =
            client.handshake.auth?.token ||
            (typeof client.handshake.headers?.authorization === 'string'
                ? client.handshake.headers.authorization.replace(/^Bearer\s+/i, '')
                : undefined);

        if (!token) return false;

        const payload = await verifyJwt(token);
        client.data.user = {
            sub: payload.sub,
            email: payload.email,
            name: payload.name,
        };
        return true;
    }
}
