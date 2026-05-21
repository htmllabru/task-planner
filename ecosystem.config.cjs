/** PM2: production process for Task Planner */
module.exports = {
  apps: [
    {
      name: 'task-planner',
      cwd: '/var/www/task-planner',
      script: 'dist/server.js',
      instances: 1,
      autorestart: true,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
