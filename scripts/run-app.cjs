#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const mode = process.argv[2] || 'start';

const commandMap = {
  start: [
    { name: 'backend', script: 'start:backend' },
    { name: 'frontend', script: 'start:frontend' },
  ],
  dev: [
    { name: 'backend', script: 'dev:backend' },
    { name: 'frontend', script: 'dev:frontend' },
  ],
};

if (!Object.prototype.hasOwnProperty.call(commandMap, mode)) {
  console.error(`Unsupported mode: ${mode}. Use "start" or "dev".`);
  process.exit(1);
}

const npmCliCandidates = [
  process.env.npm_execpath,
  path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js'),
  path.join(path.dirname(process.execPath), '..', 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js'),
].filter(Boolean);

const npmCliPath = npmCliCandidates.find((candidate) => {
  try {
    return fs.existsSync(candidate);
  } catch {
    return false;
  }
});

if (!npmCliPath) {
  console.error('Unable to resolve npm CLI path for process runner.');
  process.exit(1);
}

const runnerCommand = process.execPath;
const runnerBaseArgs = [npmCliPath];
const commands = commandMap[mode];

const children = [];
let shuttingDown = false;
let exitCode = 0;
let exitedCount = 0;

const getTaskkillPath = () => path.join(process.env.windir || 'C:\\Windows', 'System32', 'taskkill.exe');

const terminateChild = (child) => {
  if (!child || child.killed) {
    return;
  }

  if (process.platform === 'win32') {
    const taskkill = getTaskkillPath();
    spawn(taskkill, ['/PID', String(child.pid), '/T', '/F'], {
      stdio: 'ignore',
      windowsHide: true,
    }).on('error', () => {
      try {
        child.kill('SIGTERM');
      } catch {
        // No-op fallback for best-effort shutdown.
      }
    });
    return;
  }

  try {
    child.kill('SIGTERM');
  } catch {
    // No-op fallback for best-effort shutdown.
  }
};

const shutdown = (code) => {
  if (!shuttingDown) {
    shuttingDown = true;
    exitCode = code;
    children.forEach((child) => terminateChild(child.process));
  }
};

const completeIfDone = () => {
  if (exitedCount >= children.length) {
    process.exit(exitCode);
  }
};

const forwardStream = (stream, target) => {
  if (!stream) {
    return;
  }

  stream.on('data', (chunk) => {
    try {
      target.write(chunk);
    } catch (error) {
      if (!error || error.code !== 'EPIPE') {
        console.error('Failed to forward child process output:', error);
      }
    }
  });
};

commands.forEach(({ name, script }) => {
  const child = spawn(
    runnerCommand,
    [...runnerBaseArgs, 'run', script],
    {
      cwd: process.cwd(),
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
      shell: false,
    },
  );

  children.push({ name, process: child });
  forwardStream(child.stdout, process.stdout);
  forwardStream(child.stderr, process.stderr);

  child.on('error', (error) => {
    console.error(`Failed to start ${name}:`, error);
    exitedCount += 1;
    shutdown(1);
    completeIfDone();
  });

  child.on('exit', (code, signal) => {
    exitedCount += 1;

    if (!shuttingDown) {
      const normalizedCode = signal ? 1 : (code ?? 1);
      shutdown(normalizedCode);
    }

    completeIfDone();
  });
});

const handleSignal = () => {
  shutdown(0);
};

process.on('SIGINT', handleSignal);
process.on('SIGTERM', handleSignal);
