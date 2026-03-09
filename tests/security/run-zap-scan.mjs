#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const target = process.env.ZAP_TARGET_URL ?? 'http://localhost:8081/api/health';
const failOn = (process.env.ZAP_FAIL_ON_RISK ?? 'high').toLowerCase();
const reportsDir = path.resolve('reports/security');
const reportJson = path.join(reportsDir, 'zap-report.json');

mkdirSync(reportsDir, { recursive: true });

const dockerCheck = spawnSync('docker', ['--version'], { stdio: 'pipe' });
if (dockerCheck.status !== 0) {
  console.warn('[security] Docker is unavailable; skipping OWASP ZAP baseline scan.');
  process.exit(0);
}

const zapArgs = [
  'run',
  '--rm',
  '-t',
  '-v',
  `${reportsDir}:/zap/wrk`,
  'ghcr.io/zaproxy/zaproxy:stable',
  'zap-baseline.py',
  '-t',
  target,
  '-J',
  'zap-report.json',
  '-w',
  'zap-report.md',
  '-r',
  'zap-report.html',
  '-m',
  process.env.ZAP_SPIDER_MINUTES ?? '2',
  '-d',
];

console.log(`[security] Running OWASP ZAP baseline scan against ${target}`);
const zapRun = spawnSync('docker', zapArgs, { stdio: 'inherit' });

if (![0, 1, 2].includes(zapRun.status ?? 1)) {
  process.exit(zapRun.status ?? 1);
}

if (!existsSync(reportJson)) {
  console.warn('[security] ZAP report JSON was not generated; skipping risk gate.');
  process.exit(0);
}

const raw = readFileSync(reportJson, 'utf8');
const parsed = JSON.parse(raw) as {
  site?: Array<{
    alerts?: Array<{ riskcode?: string }>;
  }>;
};

let high = 0;
let medium = 0;
for (const site of parsed.site ?? []) {
  for (const alert of site.alerts ?? []) {
    if (alert.riskcode === '3') {
      high += 1;
    } else if (alert.riskcode === '2') {
      medium += 1;
    }
  }
}

console.log(`[security] ZAP findings: high=${high}, medium=${medium}`);

const shouldFail =
  (failOn === 'high' && high > 0) ||
  (failOn === 'medium' && (high > 0 || medium > 0));

if (shouldFail) {
  console.error(`[security] Failing due to ZAP ${failOn}+ findings.`);
  process.exit(1);
}

process.exit(0);
