const lightCodeTheme = require('prism-react-renderer').themes.github;
const darkCodeTheme = require('prism-react-renderer').themes.dracula;

const hasAlgolia =
  Boolean(process.env.ALGOLIA_APP_ID) &&
  Boolean(process.env.ALGOLIA_API_KEY) &&
  Boolean(process.env.ALGOLIA_INDEX_NAME);

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'PrimeCal Docs',
  tagline: 'Guided setup, daily workflows, automation, MCP, and API reference for PrimeCal.',
  url: process.env.DOCS_SITE_URL || 'https://docs.primecal.local',
  baseUrl: '/',
  onBrokenLinks: 'warn',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },
  favicon: 'img/favicon.svg',
  trailingSlash: false,
  organizationName: 'Csepi',
  projectName: 'cal3',
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },
  presets: [
    [
      'classic',
      {
        docs: {
          path: '../docs',
          routeBasePath: '/',
          sidebarPath: require.resolve('./sidebars.js'),
          showLastUpdateAuthor: false,
          showLastUpdateTime: true,
          breadcrumbs: true,
          includeCurrentVersion: true,
          include: [
            'index.md',
            'STYLE_GUIDE.md',
            'CONTRIBUTING_TO_DOCS.md',
            'AUDIT_REPORT.md',
            'MIGRATION_PLAN.md',
            'DEPRECATED_CONTENT.md',
            'QUALITY_ASSURANCE.md',
            'METRICS_KPIS.md',
            'SEARCH_OPTIMIZATION.md',
            'GETTING-STARTED/**/*.{md,mdx}',
            'USER-GUIDE/**/*.{md,mdx}',
            'ADMIN-GUIDE/**/*.{md,mdx}',
            'DEVELOPER-GUIDE/**/*.{md,mdx}',
            'DEPLOYMENT-GUIDE/**/*.{md,mdx}',
            'TROUBLESHOOTING/**/*.{md,mdx}',
            'REFERENCE/**/*.{md,mdx}',
            'FAQ/**/*.{md,mdx}',
            'BEST-PRACTICES/**/*.{md,mdx}',
            'LEGAL/**/*.{md,mdx}',
            'RESOURCES/**/*.{md,mdx}',
          ],
          exclude: ['archives/**'],
        },
        blog: false,
        pages: false,
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
        sitemap: {
          changefreq: 'weekly',
          priority: 0.7,
          filename: 'sitemap.xml',
          ignorePatterns: ['**/archives/**'],
        },
        gtag: {
          trackingID: process.env.GA_TRACKING_ID || 'G-XXXXXXXXXX',
          anonymizeIP: true,
        },
      },
    ],
  ],
  plugins: [
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      {
        hashed: true,
        language: ['en'],
        docsDir: '../docs',
        docsRouteBasePath: '/',
        indexDocs: true,
        indexBlog: false,
        indexPages: false,
        highlightSearchTermsOnTargetPage: true,
        explicitSearchResultPath: true,
      },
    ],
  ],
  themeConfig: {
    image: 'img/primecalendar-docs-og.svg',
    metadata: [
      {
        name: 'keywords',
        content:
          'primecal, calendar documentation, scheduling docs, api reference, deployment guide',
      },
    ],
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'PrimeCal Docs',
      items: [
        {
          to: '/',
          label: 'Home',
          position: 'left',
        },
        {
          to: '/GETTING-STARTED',
          label: 'Getting Started',
          position: 'left',
        },
        {
          to: '/USER-GUIDE',
          label: 'User Docs',
          position: 'left',
        },
        {
          to: '/USER-GUIDE/automation/introduction-to-automation',
          label: 'Automation',
          position: 'left',
        },
        {
          to: '/DEVELOPER-GUIDE/api-reference/api-overview',
          label: 'API',
          position: 'left',
        },
        {
          href: 'https://primecal.eu',
          label: 'Main Site',
          className: 'pc-navbar-link--site',
          position: 'right',
        },
        {
          href: 'https://app.primecal.eu/',
          label: 'Open App',
          className: 'pc-navbar-link--app',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            { label: 'Home', to: '/' },
            { label: 'Getting Started', to: '/GETTING-STARTED' },
            { label: 'User Docs', to: '/USER-GUIDE' },
            { label: 'Developer Docs', to: '/DEVELOPER-GUIDE' },
            { label: 'API Reference', to: '/DEVELOPER-GUIDE/api-reference/api-overview' },
          ],
        },
        {
          title: 'Support',
          items: [
            { label: 'Troubleshooting', to: '/TROUBLESHOOTING' },
            { label: 'FAQ', to: '/FAQ' },
            { label: 'Support Contact', to: '/RESOURCES/support-contact' },
          ],
        },
        {
          title: 'PrimeCal',
          items: [
            { label: 'Main Site', href: 'https://primecal.eu' },
            { label: 'Open App', href: 'https://app.primecal.eu/' },
          ],
        },
      ],
      copyright: `Copyright (c) ${new Date().getFullYear()} PrimeCal`,
    },
    prism: {
      theme: lightCodeTheme,
      darkTheme: darkCodeTheme,
      additionalLanguages: ['bash', 'json', 'yaml', 'sql', 'http'],
    },
    docs: {
      sidebar: {
        hideable: true,
        autoCollapseCategories: false,
      },
    },
    ...(hasAlgolia
      ? {
          algolia: {
            appId: process.env.ALGOLIA_APP_ID,
            apiKey: process.env.ALGOLIA_API_KEY,
            indexName: process.env.ALGOLIA_INDEX_NAME,
            contextualSearch: true,
            searchPagePath: 'search',
          },
        }
      : {}),
  },
};

module.exports = config;
