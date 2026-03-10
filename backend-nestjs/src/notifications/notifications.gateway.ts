import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from './notifications.service';
import { ModuleRef } from '@nestjs/core';
import {
  NOTIFICATION_WS_NAMESPACE,
  NOTIFICATION_WS_PATH,
} from './notifications.constants';
import { resolveAllowedOrigins } from '../common/security/security.config';

import { bStatic } from '../i18n/runtime';

interface AuthenticatedSocket extends Socket {
  userId?: number;
}

@WebSocketGateway({
  namespace: NOTIFICATION_WS_NAMESPACE,
  path: NOTIFICATION_WS_PATH,
  cors: {
    origin: resolveAllowedOrigins(),
    credentials: true,
  },
})
export class NotificationsGateway
  implements
    OnGatewayConnection<AuthenticatedSocket>,
    OnGatewayDisconnect<AuthenticatedSocket>
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private readonly jwtSecret: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly moduleRef: ModuleRef,
  ) {
    this.jwtSecret =
      this.configService.get<string>('JWT_SECRET') || 'default-secret-key';
  }

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    try {
      const token = this.extractToken(client);
      if (!token) {
        throw new UnauthorizedException(bStatic('errors.auto.backend.k83c5c9c6bc74'));
      }
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.jwtSecret,
      });
      const userId = Number(payload.sub);
      if (!Number.isInteger(userId)) {
        throw new UnauthorizedException(bStatic('errors.auto.backend.k4cc2a1355828'));
      }
      client.userId = userId;
      await client.join(`user:${userId}`);
      this.moduleRef
        .get(NotificationsService, { strict: false })
        ?.trackConnection(userId, client.id);
      this.logger.debug(
        `WebSocket connection established for user ${client.userId} (${client.id})`,
      );
    } catch (error) {
      this.logger.warn(
        `WebSocket authentication failed: ${error instanceof Error ? error.message : error}`,
      );
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: AuthenticatedSocket): Promise<void> {
    if (client.userId) {
      this.moduleRef
        .get(NotificationsService, { strict: false })
        ?.dropConnection(client.userId, client.id);
      this.logger.debug(
        `WebSocket disconnected for user ${client.userId} (${client.id})`,
      );
    }
  }

  @SubscribeMessage('ping')
  handlePing(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: unknown,
  ): { type: string; data: unknown } {
    if (!client.userId) {
      throw new UnauthorizedException(bStatic('errors.auto.backend.k9fd2ff4fc1fb'));
    }
    return { type: 'pong', data: body ?? null };
  }

  private extractToken(client: Socket): string | undefined {
    const { token } = client.handshake.query;
    if (typeof token === 'string') {
      return token;
    }

    const headerToken = client.handshake.headers.authorization;
    if (typeof headerToken === 'string' && headerToken.startsWith('Bearer ')) {
      return headerToken.slice('Bearer '.length);
    }

    return undefined;
  }
}
