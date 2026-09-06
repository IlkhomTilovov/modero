const { execFileSync } = require('child_process');
const path = require('path');
const os = require('os');

const PG_BIN = 'C:/Program Files/PostgreSQL/17/bin/pg_ctl.exe';
const DATA_DIR = path.join(os.homedir(), '.modero-pgdata');
const LOG_FILE = path.join(DATA_DIR, 'logfile.txt');

const action = process.argv[2] || 'start';

if (!['start', 'stop', 'status'].includes(action)) {
  console.error('Usage: node db-start.js <start|stop|status>');
  process.exit(1);
}

const args = ['-D', DATA_DIR];
if (action === 'start') args.push('-l', LOG_FILE, '-w', 'start');
else args.push(action);

try {
  const out = execFileSync(PG_BIN, args, { encoding: 'utf8' });
  console.log(out);
} catch (err) {
  // pg_ctl status/stop exit non-zero when already stopped — surface but don't crash dev:all
  console.log(err.stdout || err.message);
}
