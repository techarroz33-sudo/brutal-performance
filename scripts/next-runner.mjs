import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const nextBin = path.join(path.dirname(require.resolve('next/package.json')), 'dist/bin/next');

const [, , mode = 'dev', ...rawArgs] = process.argv;
const command = mode === 'start' ? 'start' : 'dev';

let port = '3000';
let hostname = '0.0.0.0';
const passthroughArgs = [];

const allowedNextFlags = new Set([
  '--turbo',
  '--turbopack',
  '--webpack',
  '--disable-source-maps',
  '--experimental-https',
  '--no-server-fast-refresh',
  '--experimental-next-config-strip-types',
  '--experimental-cpu-prof',
]);

for (let i = 0; i < rawArgs.length; i += 1) {
  const arg = rawArgs[i];

  if (arg === '-p' || arg === '--port') {
    if (rawArgs[i + 1]) {
      port = rawArgs[i + 1];
      i += 1;
    }
    continue;
  }
  if (arg.startsWith('--port=')) {
    port = arg.slice('--port='.length) || port;
    continue;
  }

  if (arg === '-H' || arg === '--hostname' || arg === '--host') {
    if (rawArgs[i + 1] && !rawArgs[i + 1].startsWith('-')) {
      hostname = rawArgs[i + 1];
      i += 1;
    }
    continue;
  }
  if (arg.startsWith('--hostname=')) {
    hostname = arg.slice('--hostname='.length) || hostname;
    continue;
  }
  if (arg.startsWith('--host=')) {
    hostname = arg.slice('--host='.length) || hostname;
    continue;
  }

  if (allowedNextFlags.has(arg)) {
    passthroughArgs.push(arg);
  }
}

const child = spawn(
  process.execPath,
  [nextBin, command, '-p', port, '-H', hostname, ...passthroughArgs],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: port,
    },
  }
);

const forwardSignal = (signal) => {
  if (!child.killed) {
    child.kill(signal);
  }
};

process.on('SIGINT', () => forwardSignal('SIGINT'));
process.on('SIGTERM', () => forwardSignal('SIGTERM'));

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
