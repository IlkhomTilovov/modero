const { execFileSync } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');
const net = require('net');

const PG_BIN = 'C:/Program Files/PostgreSQL/17/bin/pg_ctl.exe';
const DATA_DIR = path.join(os.homedir(), '.modero-pgdata');
const LOG_FILE = path.join(DATA_DIR, 'logfile.txt');

function getConfiguredPort() {
  try {
    const conf = fs.readFileSync(path.join(DATA_DIR, 'postgresql.conf'), 'utf8');
    const match = conf.match(/^\s*port\s*=\s*(\d+)/m);
    if (match) return Number(match[1]);
  } catch {
    // fall through to default below
  }
  return 5434;
}

function probePort(port, host = '127.0.0.1', timeoutMs = 800) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const done = (ok) => {
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => done(true));
    socket.once('timeout', () => done(false));
    socket.once('error', () => done(false));
    socket.connect(port, host);
  });
}

async function waitForPort(port, attempts = 10, delayMs = 500) {
  for (let i = 0; i < attempts; i++) {
    if (await probePort(port)) return true;
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return false;
}

async function main() {
  const action = process.argv[2] || 'start';
  if (!['start', 'stop', 'status'].includes(action)) {
    console.error('Usage: node db-start.js <start|stop|status>');
    process.exit(1);
  }

  const port = getConfiguredPort();
  const args = ['-D', DATA_DIR];
  if (action === 'start') args.push('-l', LOG_FILE, '-w', 'start');
  else args.push(action);

  try {
    const out = execFileSync(PG_BIN, args, { encoding: 'utf8' });
    console.log(out);
  } catch (err) {
    // pg_ctl status/stop exit non-zero when already stopped, and start exits
    // non-zero when a cluster is already running — both are fine, not fatal.
    console.log(err.stdout || err.message);
  }

  if (action === 'start') {
    const up = await waitForPort(port);
    if (up) {
      console.log(`[db-start] Postgres (Moredo dev) is listening on 127.0.0.1:${port}`);
    } else {
      console.error(
        `[db-start] XATOLIK: Postgres port ${port} ochilmadi. ${LOG_FILE} faylini tekshiring.`
      );
      process.exit(1);
    }
  }
}

main();
