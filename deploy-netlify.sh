#!/bin/bash

# Script to deploy to Netlify with reliable husky skipping
echo "Starting Netlify deployment process..."

# Make sure environment variables are set
export SKIP_HUSKY=1
export CI=true

# Install dependencies with husky disabled
echo "Installing dependencies without husky..."
SKIP_HUSKY=1 npm ci || SKIP_HUSKY=1 npm install

# Build the application
echo "Building application..."
npm run build

# Deploy to Netlify if netlify-cli is installed
if command -v netlify &> /dev/null; then
    echo "Deploying to Netlify..."
    netlify deploy --prod
else
    echo "netlify-cli not found. Install with: npm install -g netlify-cli"
    echo "Then authenticate with: netlify login"
    echo "Then deploy with: netlify deploy --prod"
fi

echo "Deployment process complete."
