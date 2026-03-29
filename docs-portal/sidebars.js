/**
 * Curated sidebar for the docs portal.
 * The repository still contains broader source material, but the live portal
 * should guide users through the core product paths first.
 */
module.exports = {
  docsSidebar: [
    'index',
    {
      type: 'category',
      label: 'Getting Started',
      link: { type: 'doc', id: 'GETTING-STARTED/index' },
      items: [
        'GETTING-STARTED/quick-start-guide',
        'GETTING-STARTED/first-steps/creating-your-account',
        'GETTING-STARTED/first-steps/initial-setup',
        'GETTING-STARTED/first-steps/creating-your-first-event',
      ],
    },
    {
      type: 'category',
      label: 'User Documentation',
      link: { type: 'doc', id: 'USER-GUIDE/index' },
      items: [
        'USER-GUIDE/profile/profile-page',
        {
          type: 'category',
          label: 'Calendar',
          items: [
            'USER-GUIDE/calendars/calendar-workspace',
            'USER-GUIDE/calendars/calendar-groups',
            'USER-GUIDE/basics/creating-events',
            'USER-GUIDE/basics/calendar-views',
            'USER-GUIDE/basics/focus-mode-and-live-focus',
          ],
        },
        'USER-GUIDE/tasks/tasks-workspace',
        {
          type: 'category',
          label: 'Automation',
          link: { type: 'doc', id: 'USER-GUIDE/automation/introduction-to-automation' },
          items: [
            'USER-GUIDE/automation/creating-automation-rules',
            'USER-GUIDE/automation/triggers-and-conditions',
            'USER-GUIDE/automation/actions-overview',
            'USER-GUIDE/automation/managing-and-running-automations',
          ],
        },
        'USER-GUIDE/integrations/external-sync',
        'USER-GUIDE/agents/agent-configuration',
        'USER-GUIDE/privacy/personal-logs',
      ],
    },
    {
      type: 'category',
      label: 'Developer Documentation',
      link: { type: 'doc', id: 'DEVELOPER-GUIDE/index' },
      items: [
        {
          type: 'category',
          label: 'API Reference',
          link: { type: 'doc', id: 'DEVELOPER-GUIDE/api-reference/api-overview' },
          items: [
            'DEVELOPER-GUIDE/api-reference/authentication-api',
            'DEVELOPER-GUIDE/api-reference/user-api',
            'DEVELOPER-GUIDE/api-reference/personal-logs-api',
            'DEVELOPER-GUIDE/api-reference/compliance-api',
            'DEVELOPER-GUIDE/api-reference/calendar-api',
            'DEVELOPER-GUIDE/api-reference/event-api',
            'DEVELOPER-GUIDE/api-reference/tasks-api',
            'DEVELOPER-GUIDE/api-reference/automation-api',
            'DEVELOPER-GUIDE/api-reference/sync-api',
            'DEVELOPER-GUIDE/api-reference/agent-api',
            'DEVELOPER-GUIDE/api-reference/notifications-api',
            'DEVELOPER-GUIDE/api-reference/organization-api',
            'DEVELOPER-GUIDE/api-reference/resource-api',
            'DEVELOPER-GUIDE/api-reference/booking-api',
            'DEVELOPER-GUIDE/api-reference/platform-api',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'FAQ',
      link: { type: 'doc', id: 'FAQ/index' },
      items: ['FAQ/general-faq'],
    },
  ],
};
