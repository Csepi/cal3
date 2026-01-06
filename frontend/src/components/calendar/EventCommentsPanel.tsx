import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { apiService } from '../../services/api';
import { sessionManager } from '../../services/sessionManager';
import type {
  CommentTemplateKey,
  EventComment,
  EventCommentsResponse,
} from '../../types/EventComment';
import { Button, Card, Input } from '../ui';

interface EventCommentsPanelProps {
  eventId?: number | null;
  eventTitle?: string;
  eventVisibility?: string;
  themeColor: string;
  isOpen: boolean;
}

const TEMPLATE_OPTIONS: Array<{
  key: CommentTemplateKey;
  label: string;
  helper: string;
}> = [
  {
    key: 'what_im_doing',
    label: 'LOG what I am doing',
    helper: 'Great for quick activity updates',
  },
  {
    key: 'quick_note',
    label: 'LOG a quick note',
    helper: 'Capture a short thought or reminder',
  },
  {
    key: 'reality_log',
    label: 'Reality log',
    helper: 'On-the-ground status or reality check',
  },
];

const templateLabel = (key?: CommentTemplateKey): string => {
  switch (key) {
    case 'what_im_doing':
      return 'Log: What I am doing';
    case 'quick_note':
      return 'Quick note';
    case 'reality_log':
      return 'Reality log';
    case 'open_event':
      return 'Opened event';
    default:
      return 'Comment';
  }
};

const formatUser = (comment: EventComment): string => {
  const reporter = comment.reporter || {
    username: 'Unknown',
    firstName: '',
    lastName: '',
  };
  const name = [reporter.firstName, reporter.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();
  return name || reporter.username || 'Unknown';
};

const formatDate = (value: string): string =>
  new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export const EventCommentsPanel: React.FC<EventCommentsPanelProps> = ({
  eventId,
  eventTitle,
  eventVisibility,
  themeColor,
  isOpen,
}) => {
  const [comments, setComments] = useState<EventComment[]>([]);
  const [commentsMeta, setCommentsMeta] = useState<
    Pick<EventCommentsResponse, 'canReply' | 'visibility'>
  >({
    canReply: false,
    visibility: eventVisibility || 'private',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [selectedTemplate, setSelectedTemplate] =
    useState<CommentTemplateKey>('what_im_doing');
  const [saving, setSaving] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState<Record<number, string>>({});
  const [replyTemplates, setReplyTemplates] = useState<
    Record<number, CommentTemplateKey>
  >({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState('');

  const userIdValue = sessionManager.getCurrentUser()?.id;
  const currentUserId =
    userIdValue !== undefined && userIdValue !== null
      ? Number(userIdValue)
      : undefined;
  const lastTrackedOpenRef = useRef<{ eventId: number; ts: number } | null>(
    null,
  );

  const visibilityLabel = useMemo(() => {
    const visible = commentsMeta.visibility || eventVisibility || 'private';
    return visible.charAt(0).toUpperCase() + visible.slice(1);
  }, [commentsMeta.visibility, eventVisibility]);

  const loadComments = useCallback(async () => {
    if (!eventId) {
      setComments([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getEventComments(eventId);
      setComments(response.comments || []);
      setCommentsMeta({
        canReply: response.canReply,
        visibility: response.visibility,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load comments');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  // Load comments when opening the modal
  useEffect(() => {
    if (!isOpen || !eventId) {
      return;
    }
    void loadComments();
  }, [eventId, isOpen, loadComments]);

  useEffect(() => {
    setEditingId(null);
    setEditDraft('');
    setReplyDrafts({});
    setReplyTemplates({});
  }, [eventId, isOpen]);

  // Track when the event is opened (rate-limited in backend and locally)
  useEffect(() => {
    if (!isOpen || !eventId) {
      return;
    }
    const now = Date.now();
    const recentlyTracked =
      lastTrackedOpenRef.current &&
      lastTrackedOpenRef.current.eventId === eventId &&
      now - lastTrackedOpenRef.current.ts < 60 * 1000;

    if (recentlyTracked) {
      return;
    }

    lastTrackedOpenRef.current = { eventId, ts: now };
    apiService.trackEventOpen(eventId).catch((err) => {
      console.warn('Failed to track event open', err);
    });
  }, [eventId, isOpen]);

  const mergeComment = useCallback((updated: EventComment) => {
    const merge = (items: EventComment[]): EventComment[] =>
      items.map((item) => {
        if (item.id === updated.id) {
          return { ...updated, replies: updated.replies || [] };
        }
        if (item.replies?.length) {
          const nested = merge(item.replies);
          return nested !== item.replies ? { ...item, replies: nested } : item;
        }
        return item;
      });

    setComments((prev) => merge(prev));
  }, []);

  const addReply = useCallback((parentId: number, reply: EventComment) => {
    const attach = (items: EventComment[]): EventComment[] =>
      items.map((item) => {
        if (item.id === parentId) {
          return {
            ...item,
            replies: [...(item.replies || []), reply],
          };
        }
        if (item.replies?.length) {
          return { ...item, replies: attach(item.replies) };
        }
        return item;
      });

    setComments((prev) => attach(prev));
  }, []);

  const handleCreate = async () => {
    if (!eventId) return;
    setSaving(true);
    setError(null);
    try {
      const created = await apiService.addEventComment(eventId, {
        content: draft,
        templateKey: selectedTemplate,
      });
      setComments((prev) => [...prev, created]);
      setDraft('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add comment');
    } finally {
      setSaving(false);
    }
  };

  const handleReply = async (parentId: number) => {
    if (!eventId) return;
    const replyText = replyDrafts[parentId] || '';
    const template = replyTemplates[parentId] || 'quick_note';

    if (!commentsMeta.canReply) {
      setError('Replies are only available on shared or public events');
      return;
    }

    try {
      const reply = await apiService.replyToEventComment(eventId, parentId, {
        content: replyText,
        templateKey: template,
      });
      addReply(parentId, reply);
      setReplyDrafts((prev) => {
        const next = { ...prev };
        delete (next as Record<number, string | undefined>)[parentId];
        return next;
      });
      setReplyTemplates((prev) => {
        const next = { ...prev };
        delete (next as Record<number, CommentTemplateKey | undefined>)[
          parentId
        ];
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post reply');
    }
  };

  const handleEdit = async () => {
    if (!eventId || !editingId) return;
    try {
      const updated = await apiService.updateEventComment(eventId, editingId, {
        content: editDraft,
      });
      mergeComment(updated);
      setEditingId(null);
      setEditDraft('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update comment');
    }
  };

  const handleFlag = async (comment: EventComment) => {
    if (!eventId) return;
    try {
      const updated = await apiService.flagEventComment(
        eventId,
        comment.id,
        !comment.isFlagged,
      );
      mergeComment(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update flag');
    }
  };

  const renderActions = (comment: EventComment) => {
    const isOwner = comment.reporter?.id === currentUserId;
    return (
      <div className="flex items-center gap-2 text-xs text-gray-600">
        {commentsMeta.canReply && !comment.isSystem && (
          <button
            className="hover:text-gray-900 font-medium"
            onClick={() => {
              setReplyDrafts((prev) => ({
                ...prev,
                [comment.id]: prev[comment.id] || '',
              }));
              setReplyTemplates((prev) => ({
                ...prev,
                [comment.id]: prev[comment.id] || 'quick_note',
              }));
            }}
          >
            Reply
          </button>
        )}
        {isOwner && !comment.isSystem && (
          <button
            className="hover:text-gray-900 font-medium"
            onClick={() => {
              setEditingId(comment.id);
              setEditDraft(comment.content);
            }}
          >
            Edit
          </button>
        )}
        {!comment.isSystem && (
          <button
            className={`font-medium ${
              comment.isFlagged ? 'text-red-600' : 'hover:text-gray-900'
            }`}
            onClick={() => handleFlag(comment)}
          >
            {comment.isFlagged ? 'Unflag' : 'Flag'}
          </button>
        )}
      </div>
    );
  };

  const renderComment = (comment: EventComment, depth = 0) => {
    const isEditing = editingId === comment.id;
    const replyValue = replyDrafts[comment.id];
    const replyTemplate = replyTemplates[comment.id] || 'quick_note';
    const showReply = replyValue !== undefined;
    return (
      <div
        key={comment.id}
        className={`rounded-2xl border ${
          comment.isSystem ? 'bg-gray-50' : 'bg-white'
        } ${depth > 0 ? 'mt-3 ml-4 pl-3 border-l-4 border-gray-200' : 'mt-4'}`}
        style={{ borderColor: comment.isFlagged ? '#ef4444' : undefined }}
      >
        <div className="p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-gray-800">
                  {formatUser(comment)}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDate(comment.createdAt)}
                </span>
                {comment.templateKey && (
                  <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
                    {templateLabel(comment.templateKey)}
                  </span>
                )}
                {comment.isSystem && (
                  <span className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded-full">
                    System
                  </span>
                )}
                {comment.isFlagged && (
                  <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">
                    Flagged
                  </span>
                )}
              </div>
              <div className="mt-2 text-sm text-gray-800 whitespace-pre-wrap">
                {isEditing ? (
                  <div className="space-y-2">
                    <Input
                      multiline
                      rows={3}
                      value={editDraft}
                      onChange={(e) => setEditDraft(e.target.value)}
                      themeColor={themeColor}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={handleEdit}
                        themeColor={themeColor}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingId(null);
                          setEditDraft('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  comment.content
                )}
              </div>
            </div>
            {renderActions(comment)}
          </div>

          {showReply && (
            <div className="mt-3 space-y-2">
              <Input
                label={commentsMeta.canReply ? 'Reply' : 'Replies disabled'}
                multiline
                rows={3}
                value={replyValue ?? ''}
                onChange={(e) =>
                  setReplyDrafts((prev) => ({
                    ...prev,
                    [comment.id]: e.target.value,
                  }))
                }
                disabled={!commentsMeta.canReply}
                themeColor={themeColor}
                placeholder={
                  commentsMeta.canReply
                    ? 'Add a reply with quick context...'
                    : 'Replies are available once the event is shared'
                }
              />
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <select
                  value={replyTemplate}
                  onChange={(e) =>
                    setReplyTemplates((prev) => ({
                      ...prev,
                      [comment.id]: e.target.value as CommentTemplateKey,
                    }))
                  }
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  {TEMPLATE_OPTIONS.map((tpl) => (
                    <option key={tpl.key} value={tpl.key}>
                      {tpl.label}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReply(comment.id)}
                    disabled={!commentsMeta.canReply}
                    themeColor={themeColor}
                  >
                    Send Reply
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setReplyDrafts((prev) => {
                        const next = { ...prev };
                        delete (next as Record<number, string | undefined>)[
                          comment.id
                        ];
                        return next;
                      });
                      setReplyTemplates((prev) => {
                        const next = { ...prev };
                        delete (next as Record<
                          number,
                          CommentTemplateKey | undefined
                        >)[comment.id];
                        return next;
                      });
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {comment.replies?.length ? (
          <div className="pb-2">
            {comment.replies.map((reply) => renderComment(reply, depth + 1))}
          </div>
        ) : null}
      </div>
    );
  };

  if (!eventId) {
    return (
      <Card
        themeColor={themeColor}
        header={<div className="text-lg font-semibold">Comments & Logs</div>}
        padding="lg"
      >
        <p className="text-sm text-gray-600">
          Save the event first to start logging comments or quick reality logs.
        </p>
      </Card>
    );
  }

  return (
    <Card
      themeColor={themeColor}
      header={
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-semibold text-gray-900">
              Comments & reality logs
            </div>
            <div className="text-sm text-gray-600">
              Inherits event visibility ({visibilityLabel})
            </div>
            {eventTitle && (
              <div className="text-xs text-gray-500 mt-0.5">
                Logging against "{eventTitle}"
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span
              className={`px-2 py-1 rounded-full ${
                commentsMeta.canReply
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              Replies {commentsMeta.canReply ? 'enabled' : 'locked to sharing'}
            </span>
          </div>
        </div>
      }
      padding="lg"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {TEMPLATE_OPTIONS.map((tpl) => (
            <button
              key={tpl.key}
              onClick={() => setSelectedTemplate(tpl.key)}
              className={`rounded-2xl border p-3 text-left transition-all duration-200 ${
                selectedTemplate === tpl.key
                  ? 'border-blue-500 bg-blue-50 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-semibold text-gray-800">{tpl.label}</div>
              <div className="text-xs text-gray-600 mt-1">{tpl.helper}</div>
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <Input
            label="Add a new comment"
            multiline
            rows={3}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            themeColor={themeColor}
            placeholder="Add context after the selected template..."
          />
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="text-xs text-gray-600">
              Template prefix: {templateLabel(selectedTemplate)}
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDraft('')}
                disabled={saving}
              >
                Clear
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleCreate}
                loading={saving}
                themeColor={themeColor}
              >
                Add comment
              </Button>
            </div>
          </div>
        </div>

        {loading && (
          <div className="text-sm text-gray-600">Loading comments...</div>
        )}

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
            {error}
          </div>
        )}

        {!loading && !comments.length && !error && (
          <div className="text-sm text-gray-600 bg-gray-50 border border-dashed border-gray-200 rounded-xl p-4">
            No comments yet. Use the quick templates above to log activity or
            reality checks.
          </div>
        )}

        {comments.map((comment) => renderComment(comment))}
      </div>
    </Card>
  );
};
