const MEETING_HOSTS = [
  'teams.microsoft.com',
  'teams.live.com',
  'teams.office.com',
  'meet.google.com',
  'zoom.us'
];

const URL_PATTERN = /https?:\/\/[^\s<>"'()]+/gi;
const TRAILING_PUNCTUATION = /[),.;!?]+$/;

const isMeetingHost = (host: string): boolean =>
  MEETING_HOSTS.some((domain) => host === domain || host.endsWith(`.${domain}`));

const sanitizeUrl = (url: string): string => url.replace(TRAILING_PUNCTUATION, '');

export const getMeetingLink = (description?: string | null): string | null => {
  if (!description) return null;

  const matches = description.match(URL_PATTERN);
  if (!matches) return null;

  for (const rawUrl of matches) {
    const cleaned = sanitizeUrl(rawUrl);
    try {
      const host = new URL(cleaned).hostname.toLowerCase();
      if (isMeetingHost(host)) {
        return cleaned;
      }
    } catch {
      continue;
    }
  }

  return null;
};

type MeetingLinkSource = {
  description?: string | null;
  location?: string | null;
  notes?: string | null;
};

export const getMeetingLinkFromEvent = (
  event?: MeetingLinkSource | null,
): string | null => {
  if (!event) return null;
  const combined = [event.description, event.location, event.notes]
    .filter(Boolean)
    .join('\n');
  return getMeetingLink(combined);
};
