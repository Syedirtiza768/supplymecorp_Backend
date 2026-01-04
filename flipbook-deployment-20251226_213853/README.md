# Flipbook Deployment Package
Generated: 2025-12-26 21:38:54
FlipbookId: 2025-26-Fall-Winter-Catalogue

## Contents
- **flipbook_database.sql** - Complete database dump (tables + data)
- **uploads/** - Flipbook images (WebP format)
- **deploy.sh** - Automated Linux deployment script
- **README.md** - This file

## Quick Deployment (Ubuntu Server)

### 1. Upload to Server
```bash
scp -r flipbook-deployment-20251226_213853 root@your-server:/tmp/
```

### 2. Deploy
```bash
ssh root@your-server
cd /tmp/flipbook-deployment-20251226_213853
chmod +x deploy.sh
./deploy.sh
```

### 3. Verify
```bash
curl http://localhost:3000/api/flipbooks/featured/current
```

## Manual Deployment Steps

### Import Database
```bash
sudo -u postgres psql -d orgill -f flipbook_database.sql
```

### Deploy Images
```bash
sudo cp -r uploads/* /var/www/supplymecorp_Backend/uploads/
sudo chown -R www-data:www-data /var/www/supplymecorp_Backend/uploads
sudo chmod -R 755 /var/www/supplymecorp_Backend/uploads
```

### Restart Backend
```bash
sudo systemctl restart supplymecorp-backend
```

### Clear Cache (Optional)
```bash
redis-cli FLUSHDB
```

## Verification Checklist
- [ ] API responds: http://your-domain.com/api/flipbooks/featured/current
- [ ] Images load: http://your-domain.com/uploads/flipbooks/2025-26-Fall-Winter-Catalogue/page-1.webp
- [ ] Backend logs clean: sudo journalctl -u supplymecorp-backend -n 50
- [ ] Flipbook renders on frontend

## Troubleshooting

### Database Import Fails
```bash
# Check if tables exist
sudo -u postgres psql -d orgill -c "\dt flipbook*"

# Manual import
sudo -u postgres psql -d orgill < flipbook_database.sql
```

### Images Not Loading
```bash
# Check permissions
ls -la /var/www/supplymecorp_Backend/uploads/flipbooks/

# Fix permissions
sudo chown -R www-data:www-data /var/www/supplymecorp_Backend/uploads
sudo chmod -R 755 /var/www/supplymecorp_Backend/uploads
```

### Backend Not Responding
```bash
# Check status
sudo systemctl status supplymecorp-backend

# View logs
sudo journalctl -u supplymecorp-backend -f

# Restart
sudo systemctl restart supplymecorp-backend
```
