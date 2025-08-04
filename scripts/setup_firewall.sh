#!/bin/bash

# Hardened Firewall Setup Script for Ubuntu NUC Hosting Minecraft and Vaultwarden
# Author: Elliot Dubuque

echo "Starting firewall setup..."

# Make sure UFW is installed
sudo apt update
sudo apt install -y ufw

echo "Resetting UFW to default settings..."
sudo ufw --force reset

echo "Setting default policies..."
sudo ufw default deny incoming
sudo ufw default allow outgoing

echo "Restricting SSH access to Tailscale Network ONLY..."

# SSH from Tailscale Network only
sudo ufw allow in on tailscale0 to any port 22 proto tcp comment 'Allow SSH from Tailscale Network ONLY'

echo "Allowing Minecraft Ports..."

sudo ufw allow 25565/tcp comment 'Minecraft Java Server'
sudo ufw allow 19132/udp comment 'Minecraft Bedrock Server'

echo "Allowing Local Network Access for All Services..."

# Your Network Interfaces (Found via ip addr show)
WIFI_INTERFACE="wlp1s0"
ETHERNET_INTERFACE="enp3s0"

# Allow all LAN traffic over WiFi
sudo ufw allow in on $WIFI_INTERFACE from 192.168.0.0/16 comment 'Allow LAN traffic on WiFi'

# Allow all LAN traffic over Ethernet
sudo ufw allow in on $ETHERNET_INTERFACE from 192.168.0.0/16 comment 'Allow LAN traffic on Ethernet'

echo "Allowing Tailscale Network for all services..."
sudo ufw allow from 100.64.0.0/10 comment 'Allow Tailscale Network'

echo "Enabling UFW..."
sudo ufw --force enable

echo "Firewall status:"
sudo ufw status verbose

echo "Firewall setup complete!"

echo "-----------------------------------------------"
echo "REMINDER:"
echo "Ensure SSH key-only login is configured:"
echo "  sudo nano /etc/ssh/sshd_config"
echo "With these settings:"
echo "  PasswordAuthentication no"
echo "  PermitRootLogin no"
echo "Restart SSH afterwards:"
echo "  sudo systemctl restart ssh"
echo "-----------------------------------------------"
