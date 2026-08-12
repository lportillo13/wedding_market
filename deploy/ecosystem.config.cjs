module.exports = {
  apps: [
    {
      name: "wedding-market",
      cwd: "/var/www/wedding-market",
      script: "node_modules/next/dist/bin/next",
      args: "start --hostname 127.0.0.1 --port 3001",
      interpreter: "/usr/bin/node",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      time: true,
      env: {
        NODE_ENV: "production",
        NEXT_TELEMETRY_DISABLED: "1",
      },
    },
  ],
};
