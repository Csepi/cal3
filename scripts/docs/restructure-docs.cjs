const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const DOCS = path.join(ROOT, 'docs');
const TODAY = '2026-03-10';
const VERSION = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version || '1.3.0';

const TARGETS = fs
  .readFileSync(path.join(__dirname, 'target-paths.txt'), 'utf8')
  .split(/\r?\n/)
  .map((s) => s.trim())
  .filter(Boolean);
const TARGET_SET = new Set(TARGETS);

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  let out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out = out.concat(walk(p));
    else if (p.toLowerCase().endsWith('.md')) out.push(p);
  }
  return out;
}

function rel(abs) {
  return path.relative(DOCS, abs).replace(/\\/g, '/');
}

function write(relPath, content) {
  const abs = path.join(DOCS, relPath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content.replace(/\r?\n/g, '\n'), 'utf8');
}

function copy(fromRel, toRel) {
  const from = path.join(DOCS, fromRel);
  const to = path.join(DOCS, toRel);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}

function relLink(fromRel, toRel) {
  return path.relative(path.dirname(fromRel), toRel).replace(/\\/g, '/');
}

function titleCase(name) {
  return name
    .replace(/\.md$/i, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/Api/g, 'API')
    .replace(/Oauth/g, 'OAuth')
    .replace(/Icalendar/g, 'iCalendar')
    .replace(/Soc2/g, 'SOC2')
    .replace(/Gdpr/g, 'GDPR')
    .replace(/Sms/g, 'SMS')
    .replace(/Ssl/g, 'SSL');
}

const CATEGORY_MAP = {
  'GETTING-STARTED': 'Getting Started',
  'USER-GUIDE': 'User Guide',
  'ADMIN-GUIDE': 'Admin',
  'DEVELOPER-GUIDE': 'Developer',
  'DEPLOYMENT-GUIDE': 'Deployment',
  TROUBLESHOOTING: 'Troubleshooting',
  REFERENCE: 'Reference',
  FAQ: 'FAQ',
  'BEST-PRACTICES': 'Best Practices',
  LEGAL: 'Legal',
  RESOURCES: 'Resources',
};

const AUDIENCE_MAP = {
  'GETTING-STARTED': 'End User',
  'USER-GUIDE': 'End User',
  'ADMIN-GUIDE': 'Administrator',
  'DEVELOPER-GUIDE': 'Developer',
  'DEPLOYMENT-GUIDE': 'DevOps',
  TROUBLESHOOTING: 'End User',
  REFERENCE: 'Developer',
  FAQ: 'End User',
  'BEST-PRACTICES': 'End User',
  LEGAL: 'Administrator',
  RESOURCES: 'End User',
};

function difficulty(relPath) {
  const x = relPath.toLowerCase();
  if (x.includes('index.md') || x.includes('quick') || x.includes('first-steps') || x.includes('basics')) return 'Beginner';
  if (x.includes('api') || x.includes('architecture') || x.includes('kubernetes') || x.includes('security') || x.includes('database') || x.includes('compliance') || x.includes('migration')) return 'Advanced';
  return 'Intermediate';
}

function tags(relPath) {
  const raw = relPath.replace(/\.md$/i, '').toLowerCase().split(/[\/\-]/).filter(Boolean);
  const out = [];
  for (const t of raw) {
    if (['index', 'guide'].includes(t)) continue;
    if (!out.includes(t)) out.push(t);
  }
  if (!out.includes('primecalendar')) out.push('primecalendar');
  return out.slice(0, 8);
}

function extractSummary(text) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#') && !/^\[Back\]/i.test(l) && !/^Last updated:/i.test(l));
  if (!lines.length) return 'Legacy content archived for reference.';
  const s = lines
    .slice(0, 4)
    .join(' ')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1');
  return s.length > 300 ? `${s.slice(0, 297)}...` : s;
}

const migrationRaw = fs.readFileSync(path.join(DOCS, 'MIGRATION_PLAN.md'), 'utf8');
const oldToNew = new Map();
for (const line of migrationRaw.split(/\r?\n/)) {
  const m = line.match(/^\| `([^`]+)` \| .*? \| `([^`]+)` \|/);
  if (m) oldToNew.set(m[1], m[2]);
}

const existingBefore = walk(DOCS).map(rel);
const sourceByTarget = new Map();
for (const old of existingBefore) {
  if (old.startsWith('archives/')) continue;
  if (['AUDIT_REPORT.md', 'MIGRATION_PLAN.md', 'DEPRECATED_CONTENT.md'].includes(old)) continue;
  const dest = oldToNew.get(old);
  if (!dest || !TARGET_SET.has(dest)) continue;
  if (!sourceByTarget.has(dest)) sourceByTarget.set(dest, []);
  sourceByTarget.get(dest).push(old);
}

if (fs.existsSync(path.join(DOCS, 'TROUBLESHOOTING.md'))) {
  copy('TROUBLESHOOTING.md', 'archives/pre-consolidation/TROUBLESHOOTING.md');
  fs.unlinkSync(path.join(DOCS, 'TROUBLESHOOTING.md'));
}

const topIndexes = TARGETS.filter((p) => /^[A-Z\-]+\/index\.md$/.test(p));

function homeDoc() {
  const links = topIndexes.map((p) => `- [${titleCase(p.split('/')[0].toLowerCase())}](./${p})`).join('\n');
  return `---
title: PrimeCalendar Documentation
description: Central documentation hub for PrimeCalendar with role-based navigation and progressive learning paths.
category: Documentation
audience: End User
difficulty: Beginner
last_updated: ${TODAY}
version: ${VERSION}
related:
  - ./GETTING-STARTED/index.md
  - ./USER-GUIDE/index.md
tags: [primecalendar, documentation, navigation, index]
---

# PrimeCalendar Documentation

> **Quick Summary**: This is the single source of truth for PrimeCalendar documentation. Start with your role and follow linked guides from beginner to advanced.

## Navigation

${links}

## Fast Start

1. [What Is PrimeCalendar](./GETTING-STARTED/what-is-primecalendar.md)
2. [Quick Start Guide](./GETTING-STARTED/quick-start-guide.md)
3. [Creating Your First Event](./GETTING-STARTED/first-steps/creating-your-first-event.md)
4. [Documentation FAQ](./FAQ/index.md)

## Governance

- [Style Guide](./STYLE_GUIDE.md)
- [Contributing to Docs](./CONTRIBUTING_TO_DOCS.md)
- [Audit Report](./AUDIT_REPORT.md)
- [Migration Plan](./MIGRATION_PLAN.md)
`;
}

function spaceIndex(relPath) {
  const top = relPath.split('/')[0];
  const title = titleCase(top.toLowerCase());
  const children = TARGETS.filter((p) => p.startsWith(`${top}/`) && p !== `${top}/index.md`);
  const list = children.map((p) => `- [${titleCase(path.basename(p))}](./${p.replace(`${top}/`, '')})`).join('\n');
  return `---
title: ${title}
description: Browse ${title} documentation pages.
category: ${CATEGORY_MAP[top] || 'Documentation'}
audience: ${AUDIENCE_MAP[top] || 'End User'}
difficulty: Beginner
last_updated: ${TODAY}
version: ${VERSION}
related:
  - ../index.md
tags: [primecalendar, ${top.toLowerCase()}, index, navigation]
---

# ${title}

> **Quick Summary**: This section contains all ${title} documentation pages.

## Table of Contents

${list || '- Content index pending.'}
`;
}

function styleGuideDoc() {
  return `# PrimeCalendar Documentation Style Guide

## Writing Standards

- Use second person and active voice.
- Define technical terms on first use.
- Keep sentences short and direct.
- Prefer explicit action verbs.

## Structure Requirements

- Include metadata frontmatter on all canonical pages.
- Follow the template section order.
- Include troubleshooting and related resources.
- Include time-to-complete and difficulty labels.

## Visual Standards

- Store assets in \`docs/assets/\`.
- Add alt text for all images.
- Use consistent annotation style.
- Update screenshots when UI changes.

## Accessibility

- Preserve semantic heading order.
- Use descriptive links (avoid “click here”).
- Ensure high-contrast visuals.
- Provide transcripts for video links.

## Quality Checks

- Validate links before merge.
- Check spelling and grammar.
- Confirm version/last-updated metadata.
- Verify examples against current behavior.
`;
}

function contributingDoc() {
  return `# Contributing to PrimeCalendar Documentation

## Process

1. Branch from \`main\`.
2. Update canonical docs under \`docs/\`.
3. Run docs quality checks.
4. Submit PR with context and verification notes.

## Review Criteria

- Technical accuracy
- Style guide compliance
- Link integrity
- Metadata completeness

## Reporting Issues

- Open a GitHub issue with label \`documentation\`.
- Include path, problem, and expected behavior.
- Attach screenshots for UI-related docs issues.

## Quarterly Maintenance

- Re-run docs inventory and gap analysis.
- Archive deprecated pages.
- Refresh screenshots and examples.
- Update KPIs and health dashboard inputs.
`;
}

function pageDoc(relPath) {
  const top = relPath.split('/')[0];
  const title = titleCase(path.basename(relPath));
  const parentIndex = path.join(path.dirname(relPath), 'index.md').replace(/\\/g, '/');
  const related = new Set();
  if (TARGET_SET.has(parentIndex) && parentIndex !== relPath) related.add(relLink(relPath, parentIndex));
  if (top && TARGET_SET.has(`${top}/index.md`) && `${top}/index.md` !== relPath) related.add(relLink(relPath, `${top}/index.md`));
  related.add(relLink(relPath, 'index.md'));

  const sources = sourceByTarget.get(relPath) || [];
  const sourceBullets = sources
    .map((s) => `- \`${s}\`: ${extractSummary(fs.readFileSync(path.join(DOCS, s), 'utf8'))}`)
    .join('\n');

  return `---
title: ${title}
description: Step-by-step guidance for ${title.toLowerCase()} in PrimeCalendar.
category: ${CATEGORY_MAP[top] || 'Documentation'}
audience: ${AUDIENCE_MAP[top] || 'End User'}
difficulty: ${difficulty(relPath)}
last_updated: ${TODAY}
version: ${VERSION}
related:
${Array.from(related).map((r) => `  - ${r}`).join('\n')}
tags: [${tags(relPath).join(', ')}]
---

# ${title}

> **Quick Summary**: This page explains ${title.toLowerCase()} in PrimeCalendar using practical steps and troubleshooting guidance.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Overview](#overview)
- [Step-by-Step Instructions](#step-by-step-instructions)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)
- [Related Resources](#related-resources)

---

## Prerequisites

- Access to PrimeCalendar.
- Appropriate role permissions for this workflow.

**Time to Complete**: 10-20 minutes  
**Difficulty**: ${difficulty(relPath)}

---

## Overview

Use this guide to complete ${title.toLowerCase()} reliably. Confirm expected results after each step before moving to optional advanced settings.

> Add screenshots from \`docs/assets/\` with descriptive alt text for each UI interaction.

---

## Step-by-Step Instructions

### Step 1: Open the Correct Area

- Sign in to PrimeCalendar.
- Navigate to the feature area for this workflow.
- Confirm required controls are visible.

### Step 2: Configure Required Settings

- Enter required values.
- Save changes.
- Verify expected behavior.

### Step 3: Validate Outcome

- Test one realistic scenario.
- Confirm notifications, permissions, and expected outputs.

<details>
<summary>Advanced Options</summary>

- Add optional policies and automation hooks.
- Document team defaults for repeatability.

</details>

---

## Examples

### Example 1: Team Rollout

**Scenario**: Your team needs consistent behavior for ${title.toLowerCase()}.

**Steps**:
1. Configure in a test workspace.
2. Validate with pilot users.
3. Roll out to production.

${sourceBullets ? `### Consolidated Legacy Sources\n\n${sourceBullets}\n` : '### Consolidated Legacy Sources\n\nNo direct legacy source was mapped for this page.\n'}

---

## Troubleshooting

### Issue: Configuration Does Not Apply

**Symptoms**: Settings appear saved but behavior remains unchanged.

**Solution**:
1. Verify workspace and organization context.
2. Re-check required fields and permissions.
3. Review logs and API responses.

**Prevention**: Use a pre-deployment checklist.

---

## Related Resources

${Array.from(related).map((r) => `- [${titleCase(path.basename(r))}](${r})`).join('\n')}
- [Documentation Home](${relLink(relPath, 'index.md')})

---

## Feedback

Was this helpful? [Yes] [No]  
Open an issue or pull request to improve this page.

---

*Last updated: ${TODAY} | PrimeCalendar v${VERSION}*
`;
}

for (const p of TARGETS) {
  if (p === 'index.md') {
    write(p, homeDoc());
  } else if (p === 'README.md') {
    write(p, '# PrimeCalendar Documentation\n\nCanonical entry point: [index.md](./index.md).\n');
  } else if (p === 'STYLE_GUIDE.md') {
    write(p, styleGuideDoc());
  } else if (p === 'CONTRIBUTING_TO_DOCS.md') {
    write(p, contributingDoc());
  } else if (p === 'assets/README.md') {
    write(p, '# Documentation Assets\n\nStore screenshots, diagrams, GIFs, and downloadable assets in this folder.\n');
  } else if (/^[A-Z\-]+\/index\.md$/.test(p)) {
    write(p, spaceIndex(p));
  } else {
    write(p, pageDoc(p));
  }
}

const preserve = new Set([...TARGETS, 'AUDIT_REPORT.md', 'MIGRATION_PLAN.md', 'DEPRECATED_CONTENT.md', 'DOCUMENTATION_CHECKLIST.md']);
const after = walk(DOCS).map(rel);
let archived = 0;
let redirected = 0;

for (const old of after) {
  if (old.startsWith('archives/')) continue;
  if (preserve.has(old)) continue;
  const dest = oldToNew.get(old);
  if (!dest || !TARGET_SET.has(dest)) continue;

  const archiveRel = `archives/pre-consolidation/${old}`;
  if (!fs.existsSync(path.join(DOCS, archiveRel))) {
    copy(old, archiveRel);
    archived += 1;
  }

  const redirect = `# Documentation Moved\n\nThis page has moved to the consolidated structure.\n\n- Canonical page: [${dest}](${relLink(old, dest)})\n- Archived snapshot: [${archiveRel}](${relLink(old, archiveRel)})\n`;
  write(old, redirect);
  redirected += 1;
}

console.log(`Targets created: ${TARGETS.length}`);
console.log(`Legacy archived: ${archived}`);
console.log(`Legacy redirected: ${redirected}`);
