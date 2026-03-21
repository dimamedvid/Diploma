#!/bin/bash
set -e

APP_DIR="/var/www/diploma"
SERVICE_NAME="diploma-backend"
BRANCH="main"
BACKUP_DIR="/var/backups/diploma"
TIMESTAMP="$(date +%F-%H-%M-%S)"
USERS_FILE="$APP_DIR/server/data/users.json"

echo "Creating backup directory..."
sudo mkdir -p "$BACKUP_DIR"

if [ -f "$USERS_FILE" ]; then
  echo "Backing up users.json..."
  sudo cp "$USERS_FILE" "$BACKUP_DIR/users-$TIMESTAMP.json.bak"
fi

echo "Backing up current project..."
sudo tar -czf "$BACKUP_DIR/project-$TIMESTAMP.tar.gz" -C "$APP_DIR" .

echo "Stopping backend service..."
sudo systemctl stop "$SERVICE_NAME"

echo "Updating source code..."
cd "$APP_DIR"
git fetch origin
git checkout "$BRANCH"
git pull origin "$BRANCH"

echo "Installing backend dependencies..."
cd "$APP_DIR/server"
npm install

mkdir -p "$APP_DIR/server/data"
if [ ! -f "$USERS_FILE" ]; then
  echo "[]" | sudo tee "$USERS_FILE" > /dev/null
fi

echo "Installing frontend dependencies..."
cd "$APP_DIR/my-app"
npm install

echo "Building frontend..."
npm run build

echo "Checking nginx config..."
sudo nginx -t

echo "Starting backend service..."
sudo systemctl start "$SERVICE_NAME"

echo "Reloading nginx..."
sudo systemctl reload nginx

echo "Backend status:"
sudo systemctl status "$SERVICE_NAME" --no-pager

echo "Deployment completed successfully."