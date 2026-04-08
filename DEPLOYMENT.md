# Production Deployment Guide - PDF Generation Fix

## Issue Fixed
**Error**: `Failed to launch browser: Error: Could not find Chrome (ver. 146.0.7680.153)`

This error occurred in production because Puppeteer's full package includes a bundled Chromium browser, which was not available on the Render server.

## Solution Implemented

### 1. **Dependencies Updated**
- Replaced `puppeteer` with `puppeteer-core` (lightweight, no bundled browser)
- Added `@sparticuz/chromium` (pre-configured Chromium for Render/serverless environments)

```json
{
  "dependencies": {
    "@sparticuz/chromium": "^130.1.0",
    "puppeteer-core": "^24.40.0"
  }
}
```

### 2. **PDF Utility Updated** (`src/utils/pdf.ts`)
- Added intelligent Chrome executable path detection
- Uses Sparticuz Chromium in production (`NODE_ENV=production`)
- Falls back to system Chrome in development
- No manual browser installation needed

### 3. **Environment Variables**
Added to `.env` and `.env.production`:
```env
PUPPETEER_SKIP_DOWNLOAD=true
PUPPETEER_CACHE_DIR=/tmp/puppeteer
```

### 4. **Render Configuration** (`render.yaml`)
- Ensures proper build command execution
- Sets production environment variables
- Configures Puppeteer to skip browser download

## Deployment Steps

### On Render:
1. **Update Environment Variables** in Render Dashboard:
   - Set `NODE_ENV=production`
   - Set `PUPPETEER_SKIP_DOWNLOAD=true`
   - Set `PUPPETEER_CACHE_DIR=/tmp/puppeteer`

2. **Update Build Command** (if not using render.yaml):
   ```bash
   npm install --include=optional && npm run build
   ```

3. **Redeploy** your application:
   - Push changes to your git repository
   - Trigger a new deployment on Render

### Locally:
```bash
npm install
npm run dev  # For development
# or
NODE_ENV=production npm start  # To test production setup
```

## Testing PDF Generation

After deployment, test the PDF generation:
```bash
curl https://your-app.onrender.com/api/invoices/1/pdf -H "Authorization: Bearer YOUR_TOKEN" -o test.pdf
```

## Troubleshooting

### If PDF generation still fails:
1. Check Render logs: `render.com/dashboard/services/your-service/logs`
2. Ensure `@sparticuz/chromium` package is installed: `npm list @sparticuz/chromium`
3. Verify environment variables are set on Render Dashboard

### For development issues:
- Install system Chrome/Chromium for your OS
- Or use Sparticuz: `npm install --save-optional @sparticuz/chromium`

## Key Changes Summary

| Before | After |
|--------|-------|
| `puppeteer` (full) | `puppeteer-core` (lightweight) |
| Bundled browser | `@sparticuz/chromium` for production |
| Manual Chrome installation needed | Auto-detection of available browser |
| `/opt/render/.cache/puppeteer` | `/tmp/puppeteer` (writable location) |

## References
- [Sparticuz Chromium Docs](https://github.com/sparticuz/chromium)
- [Puppeteer Core](https://pptr.dev/)
- [Render Deployment Documentation](https://render.com/docs)
