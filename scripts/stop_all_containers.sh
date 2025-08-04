#!/bin/bash

echo "🔻 Stopping all running Docker containers..."

# Get list of running container IDs
CONTAINERS=$(docker ps -q)

if [ -z "$CONTAINERS" ]; then
    echo "✅ No containers are currently running."
else
    # Stop all running containers
    docker stop $CONTAINERS
    echo "✅ All containers stopped."
fi
