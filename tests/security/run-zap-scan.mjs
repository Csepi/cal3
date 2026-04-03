#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const target = process.env.ZAP_TARGET_URL ?? 'http://localhost:8081/api/health';
const failOn = (process.env.ZAP_FAIL_ON_RISK ?? 'high').toLowerCase();
const isCi = process.env.CI === 'true';
const reportsDir = path.resolve('reports/security');
const reportJson = path.join(reportsDir, 'zap-report.json');

const targetForContainer = (() => {
  try {
    const parsed = new URL(target);
    if (['localhost', '127.0.0.1', '0.0.0.0'].includes(parsed.hostname)) {
      parsed.hostname = 'host.docker.internal';
      return parsed.toString();
    }
  } catch {
    // Keep original target when URL parsing fails.
  }
  return target;
})();

mkdirSync(reportsDir, { recursive: true });

const dockerCheck = spawnSync('docker', ['--version'], { stdio: 'pipe' });
if (dockerCheck.status !== 0 || dockerCheck.error) {
  const message = isCi
    ? '[security] Docker is unavailable; cannot run OWASP ZAP baseline scan in CI.'
    : '[security] Docker is unavailable; skipping OWASP ZAP baseline scan.';
  if (isCi) {
    console.error(message);
    process.exit(1);
  }
  console.warn(message);
  process.exit(0);
}

const zapArgs = ['run', '--rm', '-t', '--user', 'root'];

if (isCi) {
  zapArgs.push('--add-host', 'host.docker.internal:host-gateway');
}

zapArgs.push(
  '-v',
  `${reportsDir}:/zap/wrk`,
  '-v',
  `${reportsDir}:/home/zap`,
  'ghcr.io/zaproxy/zaproxy:stable',
  'zap-baseline.py',
  '-t',
  targetForContainer,
  '-J',
  'zap-report.json',
  '-w',
  'zap-report.md',
  '-r',
  'zap-report.html',
  '-m',
  process.env.ZAP_SPIDER_MINUTES ?? '2',
  '-d',
);

console.log(
  `[security] Running OWASP ZAP baseline scan against ${targetForContainer}`,
);
const zapRun = spawnSync('docker', zapArgs, { stdio: 'inherit' });

if (![0, 1, 2, 3].includes(zapRun.status ?? 1)) {
  process.exit(zapRun.status ?? 1);
}

if (!existsSync(reportJson)) {
  const message = isCi
    ? '[security] ZAP report JSON was not generated; failing CI risk gate.'
    : '[security] ZAP report JSON was not generated; skipping risk gate.';
  if (isCi) {
    console.error(message);
    process.exit(1);
  }
  console.warn(message);
  process.exit(0);
}

const raw = readFileSync(reportJson, 'utf8');
const parsed = JSON.parse(raw);

let critical = 0;
let high = 0;
let medium = 0;
for (const site of Array.isArray(parsed.site) ? parsed.site : []) {
  const alerts = Array.isArray(site?.alerts) ? site.alerts : [];
  for (const alert of alerts) {
    if (alert.riskcode === '4') {
      critical += 1;
    } else if (alert.riskcode === '3') {
      high += 1;
    } else if (alert.riskcode === '2') {
      medium += 1;
    }
  }
}

console.log(
  `[security] ZAP findings: critical=${critical}, high=${high}, medium=${medium}`,
);

const shouldFail =
  (failOn === 'critical' && critical > 0) ||
  (failOn === 'high' && high > 0) ||
  (failOn === 'medium' && (high > 0 || medium > 0));

if (shouldFail) {
  console.error(`[security] Failing due to ZAP ${failOn}+ findings.`);
  process.exit(1);
}

process.exit(0);
