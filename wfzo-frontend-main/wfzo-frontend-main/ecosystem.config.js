module.exports = {
  apps: [
    {
      name: "wfzo-fe-app-prod",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 4000",
      cwd: "./",
      exec_mode: "fork",
      instances: 1,
      env: {
        NODE_ENV: "production",
        PORT: 4000
      },
      out_file: "./logs/prod_out.log",
      error_file: "./logs/prod_out.log",
      merge_logs: true,
      autorestart: true,
      watch: false
    },
    {
      name: "wfzo-fe-app-test",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 4010",
      cwd: "./",
      exec_mode: "fork",
      instances: 1,
      env: {
        NODE_ENV: "development",
        PORT: 4010
      },
      out_file: "./logs/test_out.log",
      error_file: "./logs/test_out.log",
      merge_logs: true,
      autorestart: true,
      watch: false
    }
  ]
}
