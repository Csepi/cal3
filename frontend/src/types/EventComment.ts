export type CommentTemplateKey =
  | 'what_im_doing'
  | 'quick_note'
  | 'reality_log'
  | 'open_event';

export interface EventComment {
  id: number;
  eventId: number;
  parentCommentId?: number;
  templateKey?: CommentTemplateKey;
  content: string;
  isFlagged: boolean;
  flaggedAt?: string;
  flaggedBy?: { id: number; username?: string } | null;
  visibility: string;
  reporter: {
    id: number;
    username: string;
    firstName?: string;
    lastName?: string;
  };
  context: string;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
  replies?: EventComment[];
}

export interface EventCommentsResponse {
  visibility: string;
  canReply: boolean;
  comments: EventComment[];
}

export interface CreateEventCommentRequest {
  content?: string;
  templateKey?: CommentTemplateKey;
  isFlagged?: boolean;
}

export interface UpdateEventCommentRequest {
  content: string;
}
