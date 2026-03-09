import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { SessionUser } from '../../common/decorators/current-user.decorator.js';
import config from '../../common/config/config.js';

interface SessionRequest {
  user?: SessionUser;
  session?: { id: string };
}

@WebSocketGateway({
  namespace: '/auth',
  cors: { origin: config.clientUrl, credentials: true },
})
export class AuthGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AuthGateway.name);
  private readonly sessionSocketMap = new Map<string, Socket>();

  handleConnection(client: Socket) {
    const req = client.request as SessionRequest;

    if (!req.user) {
      client.emit('user-logout');
      client.disconnect(true);
      return;
    }

    if (req.session) {
      this.sessionSocketMap.set(req.session.id, client);
    }
    this.logger.log(
      `User ${req.user.email} connected to auth namespace: ${client.id}`,
    );
  }

  handleDisconnect(client: Socket) {
    const req = client.request as SessionRequest;
    if (req.session) {
      this.sessionSocketMap.delete(req.session.id);
    }
  }

  notifySessionExpired(sessionId: string) {
    const client = this.sessionSocketMap.get(sessionId);
    if (!client) return;

    this.logger.log(`Session expired, notifying client: ${client.id}`);
    client.emit('user-logout');
    client.disconnect(true);
    this.sessionSocketMap.delete(sessionId);
  }
}
