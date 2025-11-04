import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationThread } from '../entities/notification-thread.entity';
import { NotificationThreadState } from '../entities/notification-thread-state.entity';
import { NotificationMessage } from '../entities/notification-message.entity';
import { NotificationsGateway } from './notifications.gateway';

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

  constructor(
    @InjectRepository(NotificationThread)
    private readonly threadRepository: Repository<NotificationThread>,
    @InjectRepository(NotificationThreadState)
    private readonly threadStateRepository: Repository<NotificationThreadState>,
    @InjectRepository(NotificationMessage)
    private readonly messageRepository: Repository<NotificationMessage>,
    @Inject(forwardRef(() => NotificationsGateway))
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async registerThread(
    userId: number,
    threadKey: string,
    contextType?: string | null,
    contextId?: string | null,
  ): Promise<NotificationThreadSummary> {
    let thread = await this.threadRepository.findOne({
      where: { threadKey },
    });

    if (!thread) {
      thread = this.threadRepository.create({
        threadKey,
        contextType: contextType ?? null,
        contextId: contextId ? String(contextId) : null,
        lastMessageAt: new Date(),
      });
      thread = await this.threadRepository.save(thread);
    }

    let threadState = await this.threadStateRepository.findOne({
      where: { threadId: thread.id, userId },
    });

    if (!threadState) {
      threadState = this.threadStateRepository.create({
        threadId: thread.id,
        userId,
      });
      threadState = await this.threadStateRepository.save(threadState);
    }

    const unreadCount = await this.messageRepository.count({
      where: { threadId: thread.id, userId, isRead: false, archived: false },
    });

    return {
      id: thread.id,
      threadKey: thread.threadKey,
      contextType: thread.contextType,
      contextId: thread.contextId,
      lastMessageAt: thread.lastMessageAt,
      isMuted: threadState.isMuted,
      isArchived: threadState.isArchived,
      unreadCount,
    };
  }

  async listThreads(userId: number): Promise<NotificationThreadSummary[]> {
    const threadStates = await this.threadStateRepository.find({
      where: { userId },
      relations: ['thread'],
      order: { updatedAt: 'DESC' },
    });

    const result: NotificationThreadSummary[] = [];
    for (const state of threadStates) {
      const unreadCount = await this.messageRepository.count({
        where: {
          threadId: state.threadId,
          userId,
          isRead: false,
          archived: false,
        },
      });

      result.push({
        id: state.threadId,
        threadKey: state.thread.threadKey,
        contextType: state.thread.contextType,
        contextId: state.thread.contextId,
        lastMessageAt: state.thread.lastMessageAt,
        isMuted: state.isMuted,
        isArchived: state.isArchived,
        unreadCount,
      });
    }

    return result;
  }

  async setThreadMuted(
    userId: number,
    threadId: number,
    mute: boolean,
  ): Promise<void> {
    const state = await this.ensureThreadState(userId, threadId);
    state.isMuted = mute;
    await this.threadStateRepository.save(state);
    this.emitThreadState(userId, threadId);
  }

  async setThreadArchived(
    userId: number,
    threadId: number,
    archived: boolean,
  ): Promise<void> {
    const state = await this.ensureThreadState(userId, threadId);
    state.isArchived = archived;
    await this.threadStateRepository.save(state);
    this.emitThreadState(userId, threadId);
  }

  private async ensureThreadState(
    userId: number,
    threadId: number,
  ): Promise<NotificationThreadState> {
    const state = await this.threadStateRepository.findOne({
      where: { userId, threadId },
    });

    if (!state) {
      const thread = await this.threadRepository.findOne({ where: { id: threadId } });
      if (!thread) {
        throw new NotFoundException('Notification thread not found');
      }
      return this.threadStateRepository.save(
        this.threadStateRepository.create({ userId, threadId }),
      );
    }

    return state;
  }

  private emitThreadState(userId: number, threadId: number): void {
    try {
      this.notificationsGateway.server
        ?.to(`user:${userId}`)
        .emit('thread:state', { threadId });
    } catch (error) {
      this.logger.debug(
        `Failed to emit thread state for user ${userId}, thread ${threadId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
