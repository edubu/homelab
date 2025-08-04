#!/bin/bash

set -e

# Load .env variables
set -a
source .env
set +a

echo "Generating Caddy password hash..."
HASH=$(docker run --rm caddy caddy hash-password --plaintext "$CADDY_PASSWORD")

echo "Generated Hash: $HASH"

if grep -q "CADDY_PASSWORD_HASH=" .env; then
  sed -i "s|CADDY_PASSWORD_HASH=.*|CADDY_PASSWORD_HASH=$HASH|" .env
else
  echo "CADDY_PASSWORD_HASH=$HASH" >> .env
fi

echo "Hash inserted into .env"
