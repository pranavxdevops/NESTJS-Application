module.exports = {
  apps: [
    {
      name: "wfzo-be-app-prod",
      script: "node",
      args: "dist/src/main.js",
      cwd: "./",
      exec_mode: "fork",
      instances: 1,
      env: {
        NODE_ENV: "production",
        PORT: 4001
      },
      out_file: "./logs/prod_out.log",
      error_file: "./logs/prod_out.log",
      merge_logs: true,
      autorestart: true,
      watch: false
    },
    {
      name: "wfzo-be-app-test",
      script: "node",
      args: "dist/src/main.js",
      cwd: "./",
      exec_mode: "fork",
      instances: 1,
      env: {
        NODE_ENV: "development",
        PORT: 4011
      },
      out_file: "./logs/test_out.log",
      error_file: "./logs/test_out.log",
      merge_logs: true,
      autorestart: true,
      watch: false
    }
  ]
}
