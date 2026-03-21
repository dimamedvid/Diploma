#!/bin/bash
set -e

SERVICE_NAME="diploma-backend"

echo "Restarting backend..."
sudo systemctl restart "$SERVICE_NAME"

echo "Checking nginx config..."
sudo nginx -t

echo "Reloading nginx..."
sudo systemctl reload nginx

echo "Service status:"
sudo systemctl status "$SERVICE_NAME" --no-pager