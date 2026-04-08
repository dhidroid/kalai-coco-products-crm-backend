#!/bin/bash

# Setup script to install Chromium for PDF generation

echo "Installing Chromium for PDF generation..."

# Detect OS
OS_TYPE=$(uname -s)

case "$OS_TYPE" in
  Linux)
    echo "Linux detected. Installing chromium-browser..."
    if command -v apt-get &> /dev/null; then
      sudo apt-get update
      sudo apt-get install -y chromium-browser
    elif command -v yum &> /dev/null; then
      sudo yum install -y chromium
    elif command -v pacman &> /dev/null; then
      sudo pacman -S chromium
    else
      echo "No supported package manager found. Please install chromium-browser manually."
      exit 1
    fi
    ;;
  Darwin)
    echo "macOS detected. Installing chromium via brew..."
    if command -v brew &> /dev/null; then
      brew install chromium
    else
      echo "Homebrew not found. Please install it first from https://brew.sh"
      exit 1
    fi
    ;;
  *)
    echo "Unsupported OS: $OS_TYPE"
    echo "Please install Chromium manually and set PUPPETEER_EXECUTABLE_PATH environment variable"
    exit 1
    ;;
esac

echo "Chromium installation completed successfully!"
echo ""
echo "You can now run: npm run dev"
