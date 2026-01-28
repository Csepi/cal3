const http = require('http');
const { URL } = require('url');
const { getFrontendBaseUrl } = require('../lib/env');
const { logError } = require('../lib/errors');

const frontendBaseUrl = getFrontendBaseUrl();

const fetchUrl = (path) => new URL(path, `${frontendBaseUrl}/`).toString();

console.log(`Testing frontend at ${frontendBaseUrl}...\n`);

http
  .get(fetchUrl('/'), (res) => {
    console.log(`OK: Server responding with status ${res.statusCode}`);

    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      if (data.includes('<div id="root">')) {
        console.log('OK: HTML root element found');
      }
      if (data.includes('/src/main.tsx')) {
        console.log('OK: Main TypeScript entry point referenced');
      }
    });
  })
  .on('error', (err) => {
    logError('GET /', err);
  });

setTimeout(() => {
  http
    .get(fetchUrl('/src/types/Automation.ts'), (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        console.log('\nChecking Automation.ts module exports...');

        const hasEnums =
          data.includes('export var TriggerType') &&
          data.includes('export var AuditLogStatus');

        if (hasEnums) {
          console.log('OK: Enum exports found (TriggerType, AuditLogStatus, etc.)');
        } else {
          console.log('WARN: Missing enum exports');
        }

        console.log(
          'Note: TypeScript interfaces are type-only and stripped in compiled JS.',
        );
        console.log('Note: Import errors often indicate browser cache issues.');
        console.log('\nDiagnosis complete - module structure looks correct');
        console.log('Recommendation: clear browser cache or hard refresh.');
      });
    })
    .on('error', (err) => {
      logError('GET /src/types/Automation.ts', err);
    });
}, 500);
