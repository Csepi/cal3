import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CommentTemplateKey } from '../entities/event-comment.entity';
import { CalendarVisibility } from '../entities/calendar.entity';

export class CreateEventCommentDto {
  @ApiPropertyOptional({
    example: 'Adding agenda notes',
    description:
      'Freeform text for the comment. Will be appended after the template prefix if provided.',
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({
    enum: CommentTemplateKey,
    description: 'Optional template key to prefill the comment body',
  })
  @IsOptional()
  @IsEnum(CommentTemplateKey)
  templateKey?: CommentTemplateKey;

  @ApiPropertyOptional({
    example: 3,
    description: 'Parent comment ID when creating a reply',
  })
  @IsOptional()
  @IsNumber()
  parentCommentId?: number;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether the comment should be created as flagged',
  })
  @IsOptional()
  @IsBoolean()
  isFlagged?: boolean;
}

export class UpdateEventCommentDto {
  @ApiProperty({
    example: 'Updated with next steps',
    description: 'Updated comment content',
  })
  @IsString()
  content!: string;
}

export class FlagCommentDto {
  @ApiProperty({
    example: true,
    description: 'Flag state to apply to the comment',
  })
  @IsBoolean()
  isFlagged!: boolean;
}

export class TrackEventOpenDto {
  @ApiPropertyOptional({
    example: 'Opened event from mobile',
    description: 'Optional context note when tracking an event open',
  })
  @IsOptional()
  @IsString()
  note?: string;
}

export class EventCommentResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 42 })
  eventId!: number;

  @ApiPropertyOptional({ example: 12 })
  parentCommentId?: number;

  @ApiPropertyOptional({ enum: CommentTemplateKey })
  templateKey?: CommentTemplateKey;

  @ApiProperty({ example: 'Quick note: finalizing deck' })
  content!: string;

  @ApiProperty({ example: false })
  isFlagged!: boolean;

  @ApiPropertyOptional({ example: '2025-11-25T12:00:00Z' })
  flaggedAt?: Date;

  @ApiPropertyOptional({
    example: { id: 5, username: 'owner' },
    description: 'User that last flagged the comment',
  })
  flaggedBy?: { id: number; username?: string } | null;

  @ApiProperty({
    example: 'private',
    enum: CalendarVisibility,
    description: 'Visibility inherited from the parent event/calendar',
  })
  visibility!: CalendarVisibility;

  @ApiProperty({
    example: { id: 3, username: 'alice', firstName: 'Alice' },
    description: 'Reporter/author of the comment',
  })
  reporter!: {
    id: number;
    username: string;
    firstName?: string;
    lastName?: string;
  };

  @ApiProperty({ example: 'comment' })
  context!: string;

  @ApiProperty({ example: false })
  isSystem!: boolean;

  @ApiProperty({ example: '2025-11-25T11:00:00Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2025-11-25T11:15:00Z' })
  updatedAt!: Date;

  @ApiPropertyOptional({
    type: [EventCommentResponseDto],
    description: 'Replies to this comment',
  })
  replies?: EventCommentResponseDto[];
}
