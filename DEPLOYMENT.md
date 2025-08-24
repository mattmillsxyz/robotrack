# DigitalOcean Deployment Guide

## 🚀 Quick Setup

### 1. Create DigitalOcean Droplet
- **Image**: Ubuntu 22.04 LTS
- **Size**: Basic Plan - $4/month (512MB RAM, 1 vCPU)
- **Region**: Choose closest to your users
- **Authentication**: SSH Key (recommended)

### 2. Initial Server Setup
```bash
# SSH into your droplet
ssh root@YOUR_DROPLET_IP

# Run the setup script
curl -fsSL https://raw.githubusercontent.com/yourusername/robotrack/main/deploy-setup.sh | bash

# Logout and login again for Docker permissions
exit
ssh root@YOUR_DROPLET_IP
```

### 3. Clone Your Repository
```bash
cd /opt
git clone https://github.com/yourusername/robotrack.git
cd robotrack
```

### 4. Start the Application
```bash
# Build and start containers
docker-compose up -d --build

# Check logs
docker-compose logs -f
```

### 5. Access Your App
Your app will be available at: `http://YOUR_DROPLET_IP:3000`

## 🔧 GitHub Actions Setup

### 1. Add Repository Secrets
Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:
- `DROPLET_IP`: Your droplet's IP address
- `DROPLET_USER`: `root` (or your username)
- `DROPLET_SSH_KEY`: Your private SSH key

### 2. Push to Deploy
```bash
git add .
git commit -m "Add Docker deployment"
git push origin main
```

The GitHub Action will automatically deploy your changes!

## 📊 Monitoring

### View Logs
```bash
# All services
docker-compose logs -f

# Just the app
docker-compose logs -f app

# Just Redis
docker-compose logs -f redis
```

### Check Status
```bash
# Container status
docker-compose ps

# Resource usage
docker stats
```

### Restart Services
```bash
# Restart everything
docker-compose restart

# Restart just the app
docker-compose restart app
```

## 🔒 Security Notes

- **Firewall**: The setup script configures UFW firewall
- **SSH**: Use SSH keys, disable password authentication
- **Redis**: Only accessible from localhost (Docker network)
- **Ports**: Only 22 (SSH), 80 (HTTP), 443 (HTTPS), 3000 (App) are open

## 💰 Cost Breakdown

- **Droplet**: $4/month
- **Bandwidth**: Included (1TB)
- **Storage**: Included (10GB)
- **Total**: $4/month

## 🆘 Troubleshooting

### App Not Starting
```bash
# Check logs
docker-compose logs app

# Rebuild containers
docker-compose down
docker-compose up -d --build
```

### Redis Connection Issues
```bash
# Check Redis logs
docker-compose logs redis

# Restart Redis
docker-compose restart redis
```

### Port Already in Use
```bash
# Check what's using port 3000
sudo netstat -tlnp | grep :3000

# Kill the process or change port in docker-compose.yml
```

## 🔄 Updates

To update your application:
1. Push changes to GitHub
2. GitHub Actions will automatically deploy
3. Or manually: `docker-compose pull && docker-compose up -d`

## 📈 Scaling

If you need more resources:
- **Upgrade Droplet**: $6/month for 1GB RAM
- **Add Load Balancer**: $12/month
- **Add Database**: $15/month for managed MySQL/PostgreSQL
