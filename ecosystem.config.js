module.exports = {
  apps: [
    {
      name: 'relic-raider-shard-manager',
      script: 'shard-manager.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true
    }
  ],

  deploy: {
    production: {
      user: 'node',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'your-repo-url',
      path: '/var/www/relic-raider',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run db:generate && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
}; 