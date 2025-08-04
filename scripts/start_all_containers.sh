#!/bin/bash

echo "🚀 Starting all stopped Docker containers..."

# Get all containers (stopped and running)
CONTAINERS=$(docker ps -aq)

if [ -z "$CONTAINERS" ]; then
    echo "✅ No containers found to start."
else
    docker start $CONTAINERS
    echo "✅ All containers started."
fi