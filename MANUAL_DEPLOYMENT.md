# Manual Deployment Steps for Production Server

## Backend Deployment (supplymecorp_Backend)

### Changes Made:
- Added NCR Counterpoint price enrichment to product endpoints
- Products now display real-time prices from NCR API (PRC_1 field)
- Modified getNewProducts(), getMostViewed(), getFeaturedProducts()
- Fixed DB_PASS environment variable

### Deployment Steps:

1. **SSH into your production server:**
   ```bash
   ssh root@198.244.241.220
   # or whatever your server IP/domain is
   ```

2. **Navigate to backend directory:**
   ```bash
   cd /var/www/supplymecorp_Backend
   ```

3. **Pull latest changes:**
   ```bash
   git pull origin main
   ```

4. **Install dependencies (if package.json changed):**
   ```bash
   npm install
   ```

5. **Build the application:**
   ```bash
   npm run build
   ```

6. **Restart the backend service:**
   
   **If using PM2:**
   ```bash
   pm2 restart supplyme-backend
   # or if not configured yet:
   pm2 start dist/src/main.js --name supplyme-backend
   pm2 save
   ```

   **If using systemd:**
   ```bash
   sudo systemctl restart supplyme-backend
   ```

   **If running manually (not recommended for production):**
   ```bash
   # Stop old process
   pkill -f "node dist/src/main.js"
   # Start new process in background
   nohup node dist/src/main.js > backend.log 2>&1 &
   ```

7. **Verify deployment:**
   ```bash
   # Check if backend is running
   pm2 status
   # or
   curl http://localhost:3000/api/products/most-viewed?limit=2
   
   # Check logs
   pm2 logs supplyme-backend --lines 50
   ```

### Expected Results:

After deployment, the following endpoints will return products with price fields:
- `/api/products/most-viewed` - Returns products with `price` and `regularPrice`
- `/api/products/new` - Returns new products with pricing
- `/api/products/featured` - Returns featured products with pricing

Prices are fetched in real-time from NCR Counterpoint API (PRC_1 and REG_PRC fields).

### Environment Variables Required:

Make sure your production `.env` file has these NCR Counterpoint API credentials:
```env
COUNTERPOINT_BASE=https://utility.rrgeneralsupply.com/Item
COUNTERPOINT_TIMEOUT_MS=6000
COUNTERPOINT_API_KEY=aj88R3KMh9f588H7N4CF0XUhqsvqZrWIN9iIYXkp
COUNTERPOINT_AUTH_BASIC=Basic V0VCVEVTVC5pcnRpemE6V2ViUHJvamVjdDIwMjUk
COUNTERPOINT_COOKIE=ss-id=uO1T17i5maIaDINtmKxF; ss-pid=r0zxhE7Zor3thJKzd6f1
DB_PASS=your_database_password
```

### Troubleshooting:

**If prices are showing as null:**
- Check NCR API credentials in `.env`
- Verify NCR API is accessible from production server: `curl https://utility.rrgeneralsupply.com/Item/7520653`
- Check backend logs for NCR API errors

**If backend won't start:**
- Check logs: `pm2 logs supplyme-backend`
- Verify database connection in `.env`
- Ensure dist/src/main.js exists after build

**If products aren't showing:**
- Products must have `STAT='A'` in NCR Counterpoint to be displayed
- Check that database has products with viewCount > 0 or featured=true
