#!/bin/bash
echo "================================================"
echo "  FLIPBOOK DEPLOYMENT TO PRODUCTION"
echo "================================================"
echo ""

DB_NAME="orgill"
DB_USER="supplyme_user"
BACKEND_DIR="/var/www/supplymecorp_Backend"

echo "[1/3] Importing database..."
sudo -u postgres psql -d $DB_NAME -f flipbook_database.sql
if [ $? -eq 0 ]; then
    echo "      Database imported successfully"
else
    echo "      ERROR: Database import failed"
    exit 1
fi

echo ""
echo "[2/3] Deploying images..."
if [ -d "uploads" ]; then
    sudo mkdir -p $BACKEND_DIR/uploads
    sudo cp -r uploads/* $BACKEND_DIR/uploads/
    sudo chown -R www-data:www-data $BACKEND_DIR/uploads
    sudo chmod -R 755 $BACKEND_DIR/uploads
    IMAGE_COUNT=$(find uploads -type f | wc -l)
    echo "      Copied $IMAGE_COUNT images"
else
    echo "      WARNING: No uploads folder found"
fi

echo ""
echo "[3/3] Restarting backend service..."
sudo systemctl restart supplymecorp-backend
if [ $? -eq 0 ]; then
    echo "      Backend restarted"
else
    echo "      WARNING: Failed to restart backend"
fi

echo ""
echo "================================================"
echo "  DEPLOYMENT COMPLETE"
echo "================================================"
echo ""
echo "Verification:"
echo "  API: curl http://localhost:3000/api/flipbooks/featured/current"
echo "  Logs: sudo journalctl -u supplymecorp-backend -f"
echo ""