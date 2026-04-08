#!/bin/bash

# Render Server Setup Script for PDF Generation
# This script should be executed as part of the build process on Render

set -e

echo "========================================="
echo "Render Server PDF Generation Setup"
echo "========================================="

# Step 1: Check Node environment
echo "✓ Node version: $(node --version)"
echo "✓ NPM version: $(npm --version)"

# Step 2: Set environment variables for Render
export NODE_ENV=production
export PUPPETEER_SKIP_DOWNLOAD=true
export PUPPETEER_CACHE_DIR=/tmp/puppeteer
export PUPPETEER_EXECUTABLE_PATH="/usr/bin/chromium"

echo "✓ Environment variables set:"
echo "  - NODE_ENV=$NODE_ENV"
echo "  - PUPPETEER_SKIP_DOWNLOAD=$PUPPETEER_SKIP_DOWNLOAD"
echo "  - PUPPETEER_CACHE_DIR=$PUPPETEER_CACHE_DIR"

# Step 3: Install dependencies
echo ""
echo "Installing dependencies..."
npm ci --include=optional

# Step 4: Verify @sparticuz/chromium is installed
echo ""
echo "Verifying @sparticuz/chromium installation..."
if npm list @sparticuz/chromium > /dev/null 2>&1; then
    echo "✓ @sparticuz/chromium is installed"
else
    echo "✗ @sparticuz/chromium not found - installing..."
    npm install @sparticuz/chromium
fi

# Step 5: Build the project
echo ""
echo "Building TypeScript project..."
npm run build

# Step 6: Create cache directory
echo ""
echo "Creating Puppeteer cache directory..."
mkdir -p /tmp/puppeteer

echo ""
echo "========================================="
echo "✓ Render setup completed successfully!"
echo "========================================="
echo ""
echo "Next steps on Render Dashboard:"
echo "1. Set Build Command to: npm run build"
echo "2. Set Start Command to: npm start"
echo ""
echo "Environment Variables to set in Render:"
echo "  NODE_ENV=production"
echo "  PUPPETEER_SKIP_DOWNLOAD=true"
echo "  PUPPETEER_CACHE_DIR=/tmp/puppeteer"
