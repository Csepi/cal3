import { Injectable, Logger } from '@nestjs/common';

export interface NotificationThreadSummary {
  id: number;
  threadKey: string;
  contextType?: string | null;
  contextId?: string | null;
  lastMessageAt?: Date | null;
  isMuted?: boolean;
  isArchived?: boolean;
  unreadCount?: number;
}

@Injectable()
export class NotificationThreadsService {
  private readonly logger = new Logger(NotificationThreadsService.name);

  async registerThread(
    userId: number,
    threadKey: string,
    contextType?: string | null,
    contextId?: string | null,
  ): Promise<NotificationThreadSummary> {
    this.logger.debug(
      `registerThread placeholder invoked for user ${userId} and thread ${threadKey}`,
    );
    return {
      id: 0,
      threadKey,
      contextType: contextType ?? null,
      contextId: contextId ?? null,
      lastMessageAt: null,
      isMuted: false,
      isArchived: false,
      unreadCount: 0,
    };
  }

  async listThreads(userId: number): Promise<NotificationThreadSummary[]> {
    this.logger.debug(`listThreads placeholder invoked for user ${userId}`);
    return [];
  }

  async setThreadMuted(
    userId: number,
    threadId: number,
    mute: boolean,
  ): Promise<void> {
    this.logger.debug(
      `setThreadMuted placeholder invoked for user ${userId}, thread ${threadId}, mute=${mute}`,
    );
  }

  async setThreadArchived(
    userId: number,
    threadId: number,
    archived: boolean,
  ): Promise<void> {
    this.logger.debug(
      `setThreadArchived placeholder invoked for user ${userId}, thread ${threadId}, archived=${archived}`,
    );
  }
}
