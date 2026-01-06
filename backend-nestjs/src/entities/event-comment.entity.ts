import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { timestampTzType } from './column-types';
import { Event } from './event.entity';
import { User } from './user.entity';
import type { CalendarVisibility } from './calendar.entity';

export enum CommentTemplateKey {
  WHAT_IM_DOING = 'what_im_doing',
  QUICK_NOTE = 'quick_note',
  REALITY_LOG = 'reality_log',
  OPEN_EVENT = 'open_event',
}

@Entity('event_comments')
export class EventComment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  eventId: number;

  @ManyToOne(() => Event, (event) => event.comments, { onDelete: 'CASCADE' })
  event: Event;

  @Column()
  reporterId: number;

  @ManyToOne(() => User, (user) => user.eventComments, {
    onDelete: 'CASCADE',
  })
  reporter: User;

  @Column({ type: 'integer', nullable: true })
  parentCommentId?: number;

  @ManyToOne(() => EventComment, (comment) => comment.replies, {
    onDelete: 'CASCADE',
  })
  parentComment?: EventComment;

  @OneToMany(() => EventComment, (comment) => comment.parentComment)
  replies?: EventComment[];

  @Column({ type: 'varchar', length: 50, nullable: true })
  templateKey?: CommentTemplateKey;

  @Column({ type: 'text' })
  content: string;

  @Column({ default: false })
  isFlagged: boolean;

  @Column({ type: 'integer', nullable: true })
  flaggedById?: number;

  @Column({ type: timestampTzType, nullable: true })
  flaggedAt?: Date;

  @Column({ type: 'varchar', length: 32, default: 'comment' })
  context: string;

  @Column({
    type: 'varchar',
    length: 16,
    default: 'private',
  })
  visibility: CalendarVisibility;

  @Column({ default: false })
  isSystem: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
