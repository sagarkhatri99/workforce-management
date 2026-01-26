#!/bin/bash

# Workforce Management SaaS - Azure VM Setup Script
# Run this on Ubuntu Server 22.04 LTS
# VM Size: Standard B2s (2 vCPU, 4 GB RAM)

set -e

echo "=========================================="
echo "Workforce Management - Azure VM Setup"
echo "=========================================="

# Update system
echo "[1/7] Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install MongoDB 6+
echo "[2/7] Installing MongoDB 6..."
sudo apt-get install -y gnupg curl
curl -fsSL https://www.mongodb.org/static/pgp/server-6.0.asc | \
  sudo gpg --dearmor -o /usr/share/keyrings/mongodb.gpg

echo "deb [ signed-by=/usr/share/keyrings/mongodb.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | \
  sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl enable mongod
sudo systemctl start mongod

echo "MongoDB installed. Creating admin user..."
mongosh <<EOF
use admin
db.createUser({
  user: "admin",
  pwd: "CHANGE_THIS_PASSWORD",
  roles: [ { role: "userAdminAnyDatabase", db: "admin" }, "readWriteAnyDatabase" ]
})
exit
EOF

# Enable authentication
echo "Enabling MongoDB authentication..."
sudo sed -i 's/#security:/security:\n  authorization: enabled/' /etc/mongod.conf
sudo systemctl restart mongod

# Install Node.js 18 LTS
echo "[3/7] Installing Node.js 18 LTS..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
echo "[4/7] Installing PM2 process manager..."
sudo npm install -g pm2
pm2 startup systemd -u $USER --hp /home/$USER
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp /home/$USER

# Install Nginx
echo "[5/7] Installing Nginx..."
sudo apt-get install -y nginx

# Configure Nginx reverse proxy
echo "[6/7] Configuring Nginx..."
sudo tee /etc/nginx/sites-available/workforce-api > /dev/null <<'NGINX'
server {
    listen 80;
    server_name api.yourdomain.com;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=300r/m;
    limit_req zone=api_limit burst=50 nodelay;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX

sudo ln -sf /etc/nginx/sites-available/workforce-api /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# Install Certbot for SSL
echo "[7/7] Installing Certbot for SSL..."
sudo apt-get install -y certbot python3-certbot-nginx

echo ""
echo "=========================================="
echo "✅ Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Update MongoDB admin password:"
echo "   mongosh -u admin -p --authenticationDatabase admin"
echo "   use admin"
echo "   db.changeUserPassword('admin', 'YOUR_SECURE_PASSWORD')"
echo ""
echo "2. Update domain in Nginx config:"
echo "   sudo nano /etc/nginx/sites-available/workforce-api"
echo "   Change 'api.yourdomain.com' to your actual domain"
echo ""
echo "3. Get SSL certificate:"
echo "   sudo certbot --nginx -d api.yourdomain.com"
echo ""
echo "4. Deploy your Node.js application to /opt/workforce-api"
echo "   pm2 start /opt/workforce-api/dist/server.js --name workforce-api"
echo "   pm2 save"
echo ""
echo "MongoDB: mongodb://localhost:27017"
echo "API will run on: http://localhost:3000"
echo "Nginx proxy: http://your-domain (will redirect to :3000)"
echo ""
