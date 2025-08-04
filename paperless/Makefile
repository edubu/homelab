# Load environment variables from .env
include .env
export

# Define paths
TEMPLATE_FILE = PAPERLESS_SOCIALACCOUNT_PROVIDERS.template
COMPOSE_FILE = docker-compose.yml

# Generate the JSON with substituted secrets
.PHONY: generate
generate:
	@echo "Generating PAPERLESS_SOCIALACCOUNT_PROVIDERS from template..."
	@envsubst < $(TEMPLATE_FILE) > generated_provider.json
	@echo "✅ Done: generated_provider.json"

# Bring up the stack with substituted JSON as an environment variable
.PHONY: up
up: generate
	@echo "Starting Paperless stack with injected OIDC settings..."
	PAPERLESS_SOCIALACCOUNT_PROVIDERS="$$(cat generated_provider.json)" \
	docker compose --env-file .env up -d
	@echo "✅ Paperless is running."

# Tear down the stack
.PHONY: down
down:
	docker compose down

# View logs
.PHONY: logs
logs:
	docker compose logs -f

# Cleanup generated files
.PHONY: clean
clean:
	rm -f generated_provider.json
