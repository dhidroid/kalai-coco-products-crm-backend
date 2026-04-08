# Render Server Deployment Guide - PDF Generation Fix

## 📋 Quick Start (3 Steps)

### Step 1: Configure Build Command on Render Dashboard
```bash
npm ci --include=optional && npm run build
```

### Step 2: Configure Start Command on Render Dashboard
```bash
npm start
```

### Step 3: Set Environment Variables in Render Dashboard
Add these variables:
```
NODE_ENV=production
PUPPETEER_SKIP_DOWNLOAD=true
PUPPETEER_CACHE_DIR=/tmp/puppeteer
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
```

---

## 🚀 Automated Deployment with render.yaml

### Option A: Using render.yaml (Recommended)
This repository includes a `render.yaml` file with complete configuration.

**To enable it:**
1. Push code to your git repository
2. Go to Render Dashboard → New Web Service
3. Select your GitHub repository
4. Click "Deploy" - it will auto-detect render.yaml

**Or manually connect:**
```bash
git add render.yaml
git commit -m "Add Render configuration"
git push
```

### Option B: Manual Configuration

1. **Login to Render Dashboard**: https://render.com/dashboard

2. **Create Web Service:**
   - Click "+ New" → "Web Service"
   - Select your GitHub repository
   - Name: `kalai-coco-api`

3. **Configure Build Command:**
   ```bash
   npm ci --include=optional && npm run build
   ```

4. **Configure Start Command:**
   ```bash
   npm start
   ```

5. **Add Environment Variables:**
   Click "Environment" and add:
   ```
   NODE_ENV=production
   PUPPETEER_SKIP_DOWNLOAD=true
   PUPPETEER_CACHE_DIR=/tmp/puppeteer
   DATABASE_URL=your_db_url
   JWT_SECRET=your_secret
   PORT=3000
   ```

6. **Advanced Settings (Optional):**
   - Max Instances: 3
   - Min Instances: 1
   - Health Check Path: `/`

---

## 📦 What's Included

### Dependencies
- `puppeteer-core`: Lightweight Puppeteer without bundled browser
- `@sparticuz/chromium`: Pre-configured Chromium for Render/serverless

### Scripts Added to package.json
```json
{
  "render:build": "NODE_ENV=production npm install --include=optional && npm run build",
  "render:start": "NODE_ENV=production node dist/index.js"
}
```

### Configuration Files
- `render.yaml` - Complete Render deployment configuration
- `scripts/render-setup.sh` - Manual setup script for debugging

---

## ✅ Verification Checklist

After deployment, verify everything works:

- [ ] Application loads: `https://your-app.onrender.com`
- [ ] API responds: `https://your-app.onrender.com/api-docs`
- [ ] PDF generation works:
  ```bash
  curl https://your-app.onrender.com/api/invoices/1/pdf \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -o test.pdf
  ```

---

## 🔍 Troubleshooting

### Issue: "PDF generation error: Failed to initialize PDF generator"

**Solution 1:** Check that @sparticuz/chromium is installed
```bash
npm list @sparticuz/chromium
```

**Solution 2:** Verify environment variables in Render Dashboard
- Ensure `PUPPETEER_SKIP_DOWNLOAD=true`
- Ensure `NODE_ENV=production`

**Solution 3:** Check Render logs
- Go to Render Dashboard → Your Service → Logs
- Look for: `Using @sparticuz/chromium` (should appear when app starts)

### Issue: "Build fails: Cannot find module '@sparticuz/chromium'"

**Solution:** Ensure build command includes `--include=optional`
```bash
npm ci --include=optional && npm run build
```

### Issue: Disk space error

**Solution:** render.yaml includes 1GB disk for `/tmp/puppeteer`. If you need more:
1. Edit `render.yaml` - increase `sizeGB`
2. Redeploy

---

## 📝 How It Works

### Local Development
```bash
npm install
npm run dev
# Requires system Chrome/Chromium:
# - Linux: sudo apt install chromium-browser
# - macOS: brew install chromium
```

### Render Production
1. `@sparticuz/chromium` automatically detects and uses available Chrome
2. Files are cached in `/tmp/puppeteer` (persistent disk)
3. PDF generation works without manual browser installation

---

## 🔄 Deployment Process

### First Deployment
```bash
git add .
git commit -m "Configure Render deployment for PDF generation"
git push origin main
# Trigger deployment in Render Dashboard or wait for auto-deploy
```

### Redeployment
- Simply push changes to main branch
- Or manually trigger in Render Dashboard → "Redeploy"

### Rollback
- Render keeps deployment history
- Click previous deployment to instant rollback

---

## 📞 Support

### Check Application Logs
```bash
# In Render Dashboard
Your Service → Logs
```

### Look for these success indicators
```
✓ Puppeteer browser initialized
✓ Using @sparticuz/chromium
✓ PDF generated successfully
```

### Common Error Locations
- **src/utils/pdf.ts** - PDF generation utility
- **src/controllers/InvoiceController.ts** - PDF download endpoint
- **src/services/InvoiceService.ts** - PDF buffer generation

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Sparticuz Chromium](https://github.com/sparticuz/chromium)
- [Puppeteer Core](https://pptr.dev/)
- [Our PDF Utility](../src/utils/pdf.ts)

---

## ✨ Features Enabled

- ✅ PDF Invoice Generation
- ✅ Automatic Chromium Management
- ✅ Production-ready Configuration
- ✅ Auto-scaling (1-3 instances)
- ✅ Persistent Cache Disk
- ✅ Health Checks

---

**Last Updated:** April 8, 2026  
**Status:** ✅ Production Ready
