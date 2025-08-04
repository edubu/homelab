.PHONY init_system
init_system: init_tailnet setup_firewall
	@echo "Initializing system..."

	@echo "Done: system initialized"

.PHONY init_tailnet
init_tailnet:
	@echo "Initializing server on tailnet..."

	@echo "Add Tailscale signing key and repository..."
	curl -fsSL https://pkgs.tailscale.com/stable/ubuntu/jammy.noarmor.gpg | sudo tee /usr/share/keyrings/tailscale-archive-keyring.gpg >/dev/null
	curl -fsSL https://pkgs.tailscale.com/stable/ubuntu/jammy.tailscale-keyring.list | sudo tee /etc/apt/sources.list.d/tailscale.list
	@echo "Tailscale signing key and respository added"

	@echo "Installing Tailscale..."
	sudo apt-get update
	sudo apt-get install tailscale
	@echo "Tailscale installed"

	@echo "Enabling Tailscale subnet routing to allow for Tailscale SplitDNS..."
	echo 'net.ipv4.ip_forward = 1' | sudo tee -a /etc/sysctl.d/99-tailscale.conf
	echo 'net.ipv6.conf.all.forwarding = 1' | sudo tee -a /etc/sysctl.d/99-tailscale.conf
	sudo sysctl -p /etc/sysctl.d/99-tailscale.conf
	@echo "Tailscale subnet routing enabled"

	@echo "Starting Tailscale... please authenticate using the browser"
	sudo tailscale up --advertise-routes=102.168.0.0/24
	@echo "Tailscale started"

	@echo "Device added to tailnet with IPv4: $(sudo tailscale ip -4)"

	@echo "✅ Done: tailnet initialized"

.PHONY setup_firewall
setup_firewall:
	@echo "Setting up firewall..."
	@chmod +x scripts/setup_firewall.sh
	@bash scripts/setup_firewall.sh
	@echo "✅ Done: firewall configured"

.PHONY up
up:
	@if [ -z "$(FOLDER)" ]; then \
		echo "Error: FOLDER parameter is required. Usage: make up FOLDER=<foldername>"; \
		exit 1; \
	fi
	@if [ "$(FOLDER)" = "dashboard" ]; then \
		echo "Starting dashboard..."; \
		cd dashboard/frontend && docker compose -f docker-compose.prod.yml up --build -d; \
		echo "✅ Done: dashboard started"; \
		exit 0; \
	fi
	@if [ ! -f "$(FOLDER)/docker-compose.yml" ]; then \
		echo "Error: docker-compose.yml not found in folder '$(FOLDER)'"; \
		exit 1; \
	fi
	@echo "Starting containers in $(FOLDER)..."
	@cd $(FOLDER) && docker compose up -d
	@echo "✅ Done: containers started in $(FOLDER)"

