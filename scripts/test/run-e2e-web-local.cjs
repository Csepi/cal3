const { spawnSync } = require('child_process');

const forwardedArgs = process.argv.slice(2);
const command =
  forwardedArgs.length > 0
    ? `npm run test:e2e:web -- ${forwardedArgs.join(' ')}`
    : 'npm run test:e2e:web';

const result = spawnSync(command, {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    E2E_USE_LOCAL_SERVER: 'true',
  },
});

if (typeof result.status === 'number') {
  process.exit(result.status);
}

process.exit(1);
