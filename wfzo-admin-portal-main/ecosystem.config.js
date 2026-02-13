module.exports = {
  apps: [
    {
      name: "wfzo-admin-app-prod",
      script: "node_modules/next/dist/bin/next",
      args: "dev -p 4002",
      cwd: "./",
      exec_mode: "fork",
      instances: 1,
      env: {
        NODE_ENV: "production",
        PORT: 4002
      },
      out_file: "./logs/prod_out.log",
      error_file: "./logs/prod_out.log",
      merge_logs: true,
      autorestart: true,
      watch: false
    },
    {
      name: "wfzo-admin-app-test",
      script: "node_modules/next/dist/bin/next",
      args: "dev -p 4012",
      cwd: "./",
      exec_mode: "fork",
      instances: 1,
      env: {
        NODE_ENV: "development",
        PORT: 4012
      },
      out_file: "./logs/test_out.log",
      error_file: "./logs/test_out.log",
      merge_logs: true,
      autorestart: true,
      watch: false
    }
  ]
}
