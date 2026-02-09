import { useEffect, useMemo, useState } from 'react';
import { brandColors, type PricingTierId } from '../styles/colors';

export interface MarketingFeature {
  id: string;
  icon: string;
  title: string;
  summary: string;
  description: string;
  benefits: string[];
  image: string;
}

export interface TestimonialItem {
  name: string;
  role: string;
  quote: string;
  outcome: string;
}

export interface PricingTier {
  id: PricingTierId;
  name: string;
  priceLabel: string;
  description: string;
  cta: string;
  highlight?: string;
  popular?: boolean;
  features: string[];
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface ComparisonRow {
  capability: string;
  primecal: string;
  genericStack: string;
  manualProcess: string;
}

export interface SmartHomeHighlight {
  title: string;
  description: string;
  points: string[];
}

export interface SmartLifeScenario {
  title: string;
  points: string[];
}

export interface AdhdFeature {
  title: string;
  description: string;
}

export interface IntegrationGroup {
  title: string;
  points: string[];
}

export interface BlogPostSummary {
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  author: string;
  readTime: string;
  publishedAt: string;
  hero: string;
  content: string[];
}

const MARKETING_DESCRIPTION =
  'Be in sync with reality. PrimeCal helps teams and families unify calendars, booking workflows, smart automation, and API-ready integrations.';

const features: MarketingFeature[] = [
  {
    id: 'sync',
    icon: 'CAL',
    title: 'Universal Calendar Sync',
    summary: 'One unified timeline instead of disconnected schedules.',
    description:
      'PrimeCal merges Google Calendar, Outlook, and iCal feeds into one operational view so planning is fast and dependable.',
    benefits: [
      'Prevent double-bookings before they happen',
      'Keep one timezone strategy for your team and family',
      'See personal, work, and booking events in one interface',
    ],
    image: '/marketing/features/calendar.svg',
  },
  {
    id: 'booking',
    icon: 'BOOK',
    title: 'Booking Engine That Converts',
    summary: 'Let people self-book while you stay in control of availability.',
    description:
      'Share booking links with guardrails, accept reservations instantly, and keep calendars updated automatically.',
    benefits: [
      'Cut scheduling email loops dramatically',
      'Expose only the slots you want to offer',
      'Scale booking volume without adding admin overhead',
    ],
    image: '/marketing/features/booking.svg',
  },
  {
    id: 'automation',
    icon: 'AUTO',
    title: 'Webhook Automation',
    summary: 'Turn repetitive follow-ups into event-driven workflows.',
    description:
      'When a booking or event changes, PrimeCal can trigger reminders, notifications, and custom webhook calls so routine work runs automatically.',
    benefits: [
      'Reduce manual reminders and status updates',
      'Create consistent customer communication flows',
      'Trigger downstream systems with reliable webhooks',
    ],
    image: '/marketing/features/automation.svg',
  },
  {
    id: 'smart-home',
    icon: 'HOME',
    title: 'Smart Home and Smart Office Control',
    summary: 'Use your schedule to control physical spaces automatically.',
    description:
      'Tie events to smart actions for lights, climate, displays, and access controls so your home or office responds to your real calendar.',
    benefits: [
      'Prepare spaces before guests or teams arrive',
      'Automate office readiness for recurring meetings',
      'Reduce setup mistakes and no-show friction',
    ],
    image: '/marketing/features/smart-home.svg',
  },
  {
    id: 'teams',
    icon: 'TEAM',
    title: 'Team and Family Visibility',
    summary: 'Know who is available and what is bookable in seconds.',
    description:
      'Coordinate people, rooms, and shared schedules with one source of truth that supports roles and organization-level permissions.',
    benefits: [
      'Faster scheduling decisions',
      'Fewer resource conflicts and surprises',
      'Clear ownership and permission boundaries',
    ],
    image: '/marketing/features/team.svg',
  },
  {
    id: 'api',
    icon: 'API',
    title: 'RestAPI and Integrations',
    summary: 'Connect PrimeCal with CRM, billing, and internal systems.',
    description:
      'Use typed APIs and event hooks to automate business flows from booking through follow-up, invoicing, and reporting.',
    benefits: [
      'Integrate with existing business tools',
      'Use machine-readable error handling',
      'Build reliable custom workflows faster',
    ],
    image: '/marketing/features/api.svg',
  },
];

const testimonials: TestimonialItem[] = [
  {
    name: 'Sarah Kim',
    role: 'Mother of 3 and Freelancer',
    quote:
      'PrimeCal helped me manage work and family in one system. The ADHD-friendly reminders and routines changed everything for me.',
    outcome: 'Recovered 10+ hours every month and reduced scheduling stress',
  },
  {
    name: 'Marcus Doyle',
    role: 'Consultant',
    quote:
      'The smart office integration is incredible. My workspace adjusts to my calendar automatically, so I can focus on client work.',
    outcome: 'Planning overhead dropped by 60%',
  },
  {
    name: 'Jennifer Patil',
    role: 'Hospitality Operations Lead',
    quote:
      'Webhooks let us connect PrimeCal to our operation end-to-end. Bookings now trigger reminders and invoice workflows instantly.',
    outcome: 'Guest onboarding issues reduced by 90%',
  },
];

const pricing: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    priceLabel: '$0/month',
    description: 'Perfect for personal use and starter booking needs.',
    cta: 'Get Started Free #primecal',
    features: ['1 calendar', 'Basic sync', '50 bookings/month', 'Email reminders', 'Mobile access'],
  },
  {
    id: 'user',
    name: 'User',
    priceLabel: '$4/month',
    description: 'For individuals and freelancers who need full control.',
    cta: 'Start Free Trial #primecal',
    popular: true,
    highlight: 'Most popular',
    features: [
      'Unlimited calendars',
      'Full sync (Google, Outlook, iCal)',
      'Unlimited bookings',
      'Smart automations',
      'Email + SMS reminders',
      'Smart home webhooks (basic)',
      'RestAPI access',
      'Basic integrations',
    ],
  },
  {
    id: 'family',
    name: 'Family',
    priceLabel: '$16/month',
    description: 'For households with shared schedules and routines.',
    cta: 'Start Free Trial #primecal',
    features: [
      'Everything in User for up to 5 users',
      'Family calendar view',
      'Shared automations',
      'Family event blocking',
      'Advanced smart home control',
      'Smart office integration',
      'Shared booking links',
      'Priority support',
    ],
  },
  {
    id: 'store',
    name: 'Store',
    priceLabel: '$12/user/month',
    description: 'For organizations running bookings, staff, and resources.',
    cta: 'Contact Sales #primecal',
    features: [
      'All User features',
      'Booking system for customer management',
      'Room and resource management',
      'Staff scheduling',
      'Advanced webhooks',
      'Team analytics',
      'White-label option',
      'Dedicated support',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    priceLabel: '$20/user/month',
    description: 'For large organizations with strict SLA and support needs.',
    cta: 'Contact Sales #primecal',
    features: [
      'Everything in Store',
      'Unlimited users and calendars',
      'Unlimited automations',
      'SLA guarantee (99.9% uptime)',
      'Custom integrations',
      'On-premise option',
      'Dedicated account manager',
      'API rate limit increase',
    ],
  },
];

const faqs: FaqItem[] = [
  {
    question: 'Can I start with one calendar and expand later?',
    answer:
      'Yes. Most teams start with one synced calendar and grow into booking, automation, and advanced integrations over time.',
  },
  {
    question: 'Do paid plans include smart home and webhook features?',
    answer:
      'Yes. User and higher plans include webhook automation. Family, Store, and Enterprise add deeper smart home and smart office capabilities.',
  },
  {
    question: 'Can PrimeCal connect to our CRM or invoicing tools?',
    answer:
      'Yes. PrimeCal supports RestAPI and webhook integrations so booking data can flow directly into CRM, billing, and messaging systems.',
  },
  {
    question: 'Is PrimeCal suitable for ADHD-friendly planning?',
    answer:
      'Yes. PrimeCal includes visual schedule clarity, multi-channel reminders, and routine automation to reduce planning anxiety.',
  },
];

const comparisonRows: ComparisonRow[] = [
  {
    capability: 'Unified multi-calendar timeline',
    primecal: 'Built-in and real-time',
    genericStack: 'Partial with add-ons',
    manualProcess: 'Manual copy-paste',
  },
  {
    capability: 'Public booking pages',
    primecal: 'Native with tier controls',
    genericStack: 'Requires third-party tools',
    manualProcess: 'Email and forms',
  },
  {
    capability: 'Webhook and RestAPI automation',
    primecal: 'Visual rule builder + typed API',
    genericStack: 'Custom scripting required',
    manualProcess: 'Manual follow-up',
  },
  {
    capability: 'Smart home and office control',
    primecal: 'Calendar-driven actions',
    genericStack: 'Disconnected from schedule context',
    manualProcess: 'Manual switches and reminders',
  },
  {
    capability: 'ADHD-friendly planning support',
    primecal: 'Visual timeline + layered reminders',
    genericStack: 'Basic notification only',
    manualProcess: 'Memory and sticky notes',
  },
];

const smartHomeHighlights: SmartHomeHighlight[] = [
  {
    title: 'Smart Home Automation',
    description: 'PrimeCal does not just show your schedule. It helps your space react to it.',
    points: [
      'Guest arriving at 3pm? Unlock doors, adjust lights, and tune climate automatically',
      'Event finished? Shift to energy-saving mode without manual steps',
      'Travel day? Trigger security mode from one calendar event',
    ],
  },
  {
    title: 'Smart Office Integration',
    description: 'Meeting spaces and office routines can align with your team calendar automatically.',
    points: [
      'Conference room reserved? Prepare lighting and displays before kickoff',
      'Focus block active? Minimize distractions and avoid interruptions',
      'Standup window open? Trigger quick environment cues for collaboration',
    ],
  },
  {
    title: 'Webhook-Based Automation',
    description: 'Every event can trigger downstream actions in your existing stack.',
    points: [
      'When event is created, push payload to CRM',
      'When booking is made, start invoice workflow',
    ],
  },
  {
    title: 'RestAPI Integration',
    description: 'PrimeCal APIs let you build exactly the workflow you need.',
    points: [
      'Read and write events programmatically',
      'Manage booking logic and resource availability',
      'Create custom automations for your domain',
    ],
  },
];

const smartLifeScenarios: SmartLifeScenario[] = [
  {
    title: 'At Work',
    points: [
      'See team availability at a glance',
      'Automate repetitive scheduling tasks',
      'Reserve rooms and resources without collisions',
      'Keep teams aligned with timely reminders',
    ],
  },
  {
    title: 'In Personal Life',
    points: [
      'Coordinate family events across shared calendars',
      'Use routines to reduce planning anxiety',
      'Trigger smart home prep around arrivals and departures',
      'Protect personal focus time automatically',
    ],
  },
  {
    title: 'For Business Owners',
    points: [
      'Accept customer bookings with instant confirmations',
      'Manage staff schedules centrally',
      'Automate reminders and follow-ups with webhooks',
      'Route booking data into billing and CRM systems',
    ],
  },
];

const adhdFeatures: AdhdFeature[] = [
  {
    title: 'Location-based reminders',
    description: 'PrimeCal can remind you when context matters, not only at fixed times.',
  },
  {
    title: 'Automatic routines',
    description: 'Set weekly or monthly flows once and keep them consistent automatically.',
  },
  {
    title: 'Family calendar visibility',
    description: 'See everyone in one place to reduce uncertainty and mental load.',
  },
  {
    title: 'Multiple reminder channels',
    description: 'Mix email, SMS, push, and team notifications so important events are not missed.',
  },
  {
    title: 'Focus time blocking',
    description: 'Reserve deep-work windows and keep conflicting events away.',
  },
  {
    title: 'Visual calendar clarity',
    description: 'Use clear color cues across day, week, and month views for easier planning.',
  },
];

const integrationGroups: IntegrationGroup[] = [
  {
    title: 'Native integrations',
    points: [
      'Google Calendar full sync',
      'Microsoft Outlook 365 full sync',
      'iCal feed import',
      'Slack notifications and commands',
      'Zapier workflow extensions',
    ],
  },
  {
    title: 'Webhook and API workflows',
    points: [
      'Send booking payloads to your servers via HTTP',
      'Trigger CRM, invoicing, and messaging pipelines',
      'Call custom business logic in real time',
    ],
  },
  {
    title: 'RestAPI access',
    points: [
      'Read and write calendar events programmatically',
      'Manage bookings and resources from your own systems',
      'Use open API docs for fast integration delivery',
    ],
  },
];

const blogPosts: BlogPostSummary[] = [
  {
    slug: 'calendar-automation-playbook',
    title: 'The Calendar Automation Playbook for Service Teams',
    category: 'Automation',
    excerpt:
      'How to turn routine reservation follow-ups into reliable automated workflows in under one afternoon.',
    author: 'PrimeCal Editorial',
    readTime: '7 min',
    publishedAt: '2026-01-20',
    hero: '/marketing/screenshots/blog-automation.svg',
    content: [
      'Service teams often spend more time around bookings than on the bookings themselves. Reminders, details, and internal coordination become a hidden tax.',
      'The fastest path is to automate one frequent trigger first. For example: reservation confirmed -> send customer details plus an internal prep alert.',
      'Once the first rule is trusted, expanding to CRM sync and post-visit follow-up becomes straightforward.',
    ],
  },
  {
    slug: 'team-scheduling-without-chaos',
    title: 'Team Scheduling Without Monday Morning Chaos',
    category: 'Teams',
    excerpt:
      'A practical approach for seeing team availability, resources, and scheduling constraints in one place.',
    author: 'PrimeCal Product Team',
    readTime: '6 min',
    publishedAt: '2026-01-09',
    hero: '/marketing/screenshots/blog-team.svg',
    content: [
      'Most planning chaos starts with fragmented visibility. If people and resources are tracked in separate tools, decisions slow down and errors multiply.',
      'Unifying the view saves time and improves scheduling quality under pressure.',
      'Role-based access keeps shared visibility high while preserving governance where it matters.',
    ],
  },
  {
    slug: 'from-booking-link-to-revenue',
    title: 'From Booking Link to Revenue: The Fast Lane',
    category: 'Growth',
    excerpt:
      'Why a simple booking page can outperform email-based scheduling for consultants and agencies.',
    author: 'PrimeCal Growth',
    readTime: '5 min',
    publishedAt: '2025-12-14',
    hero: '/marketing/screenshots/blog-revenue.svg',
    content: [
      'Prospects convert faster when they can book immediately instead of waiting on email replies.',
      'A booking link backed by automation means every confirmed booking can trigger reminders and prep actions automatically.',
      'That combination increases conversion while reducing operational drag.',
    ],
  },
];

const blogCategories = ['All', 'Automation', 'Teams', 'Growth'] as const;

export interface MarketingData {
  colors: typeof brandColors;
  appUrl: string;
  isExternalAppUrl: boolean;
  features: MarketingFeature[];
  testimonials: TestimonialItem[];
  pricing: PricingTier[];
  faqs: FaqItem[];
  comparisonRows: ComparisonRow[];
  smartHomeHighlights: SmartHomeHighlight[];
  smartLifeScenarios: SmartLifeScenario[];
  adhdFeatures: AdhdFeature[];
  integrationGroups: IntegrationGroup[];
  blogPosts: BlogPostSummary[];
  blogCategories: readonly string[];
}

export function useMarketingMeta(title: string, description: string): void {
  useEffect(() => {
    document.title = `${title} | PrimeCal`;

    const metaDescription =
      document.querySelector<HTMLMetaElement>('meta[name="description"]') ??
      (() => {
        const created = document.createElement('meta');
        created.setAttribute('name', 'description');
        document.head.appendChild(created);
        return created;
      })();

    metaDescription.setAttribute('content', description);
  }, [title, description]);
}

export function useMarketing(): MarketingData {
  const [appUrl, setAppUrl] = useState('/app');

  useEffect(() => {
    const configured = import.meta.env.VITE_APP_BASE_URL as string | undefined;
    if (configured) {
      setAppUrl(configured);
      return;
    }
    setAppUrl(import.meta.env.DEV ? '/app' : 'https://app.primecal.eu');
  }, []);

  return useMemo(
    () => ({
      colors: brandColors,
      appUrl,
      isExternalAppUrl: /^https?:\/\//.test(appUrl),
      features,
      testimonials,
      pricing,
      faqs,
      comparisonRows,
      smartHomeHighlights,
      smartLifeScenarios,
      adhdFeatures,
      integrationGroups,
      blogPosts,
      blogCategories,
    }),
    [appUrl],
  );
}

export const defaultMarketingDescription = MARKETING_DESCRIPTION;
