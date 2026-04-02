const { spawnSync } = require('child_process');

const result = spawnSync('npm run test:e2e:web', {
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
