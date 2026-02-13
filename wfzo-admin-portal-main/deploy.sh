#!/bin/bash
set -e  # stop on error

ENV=$1  # test or prod

if [ -z "$ENV" ]; then
  echo "❌ Please specify environment: test or prod"
  echo "Usage: ./deploy.sh test"
  echo "   or: ./deploy.sh prod"
  exit 1
fi

if [ "$ENV" = "test" ]; then
  BRANCH="develop"
  APP_NAME="wfzo-admin-app-test"
  ENV_FILE=".env.test"
  NODE_ENV="development"
elif [ "$ENV" = "prod" ]; then
  BRANCH="main"   # or "master" if you use master
  APP_NAME="wfzo-admin-app-prod"
  ENV_FILE=".env.prod"
  NODE_ENV="production"
else
  echo "❌ Invalid environment: $ENV (use test or prod)"
  exit 1
fi

echo "🌍 Deploying to $ENV environment"
echo "🔀 Using branch: $BRANCH"
echo "🚀 PM2 app: $APP_NAME"

echo "📌 Fetching latest branches..."
git fetch origin

echo "🔀 Checking out $BRANCH branch..."
git checkout $BRANCH

echo "🔄 Pulling latest code from $BRANCH..."
git pull origin $BRANCH

echo "📦 Installing dependencies..."
npm install --force

echo "🧪 Loading env file: $ENV_FILE"
if [ -f "$ENV_FILE" ]; then
  cp $ENV_FILE .env
else
  echo "❌ Env file $ENV_FILE not found!"
  exit 1
fi

export NODE_ENV=$NODE_ENV

LOG_DIR="./logs"

echo "🧹 Clearing application logs..."

# Ensure log directory exists
mkdir -p "$LOG_DIR"

if [ "$ENV" = "prod" ]; then
  LOG_FILE="$LOG_DIR/prod_out.log"
elif [ "$ENV" = "test" ]; then
  LOG_FILE="$LOG_DIR/test_out.log"
fi

# Create file if it does not exist, then truncate
if [ -n "$LOG_FILE" ]; then
  : > "$LOG_FILE"
  echo "   - Cleared $(basename "$LOG_FILE")"
fi

echo "🏗️ Building app for $ENV..."
# npm run build

echo "🚀 Restarting PM2 app: $APP_NAME ..."
pm2 reload $APP_NAME || pm2 start ecosystem.config.js --only $APP_NAME

echo "💾 Saving PM2 process list..."
pm2 save

echo "✅ Deployment to $ENV completed successfully!"
