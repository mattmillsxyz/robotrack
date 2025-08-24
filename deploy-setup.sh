#!/bin/bash

# DigitalOcean Droplet Setup Script for RoboTrack
# Run this script on your new Ubuntu 22.04 droplet

echo "🚀 Setting up RoboTrack on DigitalOcean..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Docker
echo "🐳 Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
echo "📋 Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create app directory
echo "📁 Creating application directory..."
sudo mkdir -p /opt/robotrack
sudo chown $USER:$USER /opt/robotrack

# Clone repository (you'll need to do this manually with your repo)
echo "📥 Please clone your repository to /opt/robotrack"
echo "   git clone https://github.com/yourusername/robotrack.git /opt/robotrack"

# Create logs directory
mkdir -p /opt/robotrack/logs

# Set up firewall (optional)
echo "🔥 Setting up firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp
sudo ufw --force enable

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Clone your repository: git clone https://github.com/yourusername/robotrack.git /opt/robotrack"
echo "2. Navigate to app: cd /opt/robotrack"
echo "3. Start the app: docker-compose up -d"
echo "4. View logs: docker-compose logs -f"
echo ""
echo "Your app will be available at: http://YOUR_DROPLET_IP:3000"
