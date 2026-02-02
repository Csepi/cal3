import { Injectable } from '@nestjs/common';
import { EventEmitter } from 'events';

export type DomainEventType =
  | 'calendar.event.created'
  | 'calendar.event.updated'
  | 'calendar.event.deleted';

export interface DomainEvent<TPayload = unknown> {
  type: DomainEventType;
  payload: TPayload;
}

@Injectable()
export class DomainEventBus {
  private readonly emitter = new EventEmitter();

  emit<TPayload>(event: DomainEvent<TPayload>): void {
    this.emitter.emit(event.type, event.payload);
  }

  on<TPayload>(
    type: DomainEventType,
    handler: (payload: TPayload) => void,
  ): () => void {
    this.emitter.on(type, handler);
    return () => this.emitter.off(type, handler);
  }
}
