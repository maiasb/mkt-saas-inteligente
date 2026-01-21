module.exports = {
  apps: [
    {
      name: 'dreams-indicacoes',
      script: './node_modules/next/dist/bin/next',
      args: 'start --port 3001',
      cwd: '/var/www/dreams-indicacoes',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: '/home/maiasb/.pm2/logs/dreams-indicacoes-error.log',
      out_file: '/home/maiasb/.pm2/logs/dreams-indicacoes-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
