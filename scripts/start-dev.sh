#!/bin/bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SERVER_DIR="$ROOT_DIR/server"
CLIENT_DIR="$ROOT_DIR/my-app"
DATA_DIR="$SERVER_DIR/data"
USERS_FILE="$DATA_DIR/users.json"

mkdir -p "$DATA_DIR"

if [ ! -f "$USERS_FILE" ]; then
  echo "[]" > "$USERS_FILE"
fi

cleanup() {
  echo
  echo "Stopping backend..."
  kill "$BACKEND_PID" 2>/dev/null || true
}

trap cleanup EXIT INT TERM

echo "Starting backend..."
(
  cd "$SERVER_DIR"
  npm install
  npm run dev
) &
BACKEND_PID=$!

echo "Starting frontend..."
cd "$CLIENT_DIR"
npm install
npm start