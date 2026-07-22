// PM2 process config for the Next.js standalone production server.
// Usage:
//   pm2 start ecosystem.config.js
//   pm2 save
//
// The app binds to 127.0.0.1 only — Nginx/FastPanel proxies the public domain to it.
// Secrets are NOT defined here: Next.js loads them from the project's .env at runtime.
module.exports = {
  apps: [
    {
      name: "legal-aggregator",
      script: ".next/standalone/server.js",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        HOSTNAME: "127.0.0.1",
        PORT: "3000"
      }
    }
  ]
};
