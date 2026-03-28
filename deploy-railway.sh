#!/bin/bash

echo "🚂 MotoCheck Railway Deployment Script"
echo "========================================"
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

echo "✅ Railway CLI ready"
echo ""

# Login to Railway
echo "📝 Logging in to Railway..."
railway login

echo ""
echo "🔗 Linking to Railway project..."
railway link

echo ""
echo "📦 Running database migrations..."
railway run pnpm db:push

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Open your app:"
railway open

echo ""
echo "📊 View logs:"
echo "railway logs"
