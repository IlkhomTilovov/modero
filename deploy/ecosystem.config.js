const path = require('path');

module.exports = {
  apps: [
    {
      name: 'modero-api',
      cwd: path.join(__dirname, 'server'),
      script: 'src/index.ts',
      interpreter: 'bun',
      env: { NODE_ENV: 'production' },
      autorestart: true,
      max_restarts: 10,
      max_memory_restart: '300M',
    },
  ],
};
