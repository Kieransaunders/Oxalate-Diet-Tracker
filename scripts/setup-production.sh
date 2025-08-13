#!/bin/bash

# Production Setup Script for Oxalate Diet Tracker
# This script helps set up the production environment

set -e

echo "🍃 Oxalate Diet Tracker - Production Setup"
echo "========================================"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ No .env file found. Creating from template..."
    cp .env.example .env
    echo "✅ Created .env file from template"
    echo "⚠️  Please edit .env file and add your production API keys"
    echo ""
    echo "Required API keys:"
    echo "  - EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY"
    echo "  - EXPO_PUBLIC_VIBECODE_ANTHROPIC_API_KEY" 
    echo "  - EXPO_PUBLIC_REVENUECAT_IOS_API_KEY"
    echo "  - EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY"
    echo ""
    exit 1
fi

echo "✅ Found .env file"

# Check for required API keys
required_keys=(
    "EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY"
    "EXPO_PUBLIC_VIBECODE_ANTHROPIC_API_KEY"
    "EXPO_PUBLIC_REVENUECAT_IOS_API_KEY"
    "EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY"
)

missing_keys=()

for key in "${required_keys[@]}"; do
    value=$(grep "^${key}=" .env | cut -d'=' -f2- || echo "")
    if [ -z "$value" ] || [[ "$value" == *"your-"* ]] || [[ "$value" == *"YOUR_"* ]]; then
        missing_keys+=("$key")
    fi
done

if [ ${#missing_keys[@]} -gt 0 ]; then
    echo "❌ Missing or incomplete API keys:"
    for key in "${missing_keys[@]}"; do
        echo "  - $key"
    done
    echo ""
    echo "Please update your .env file with production API keys"
    echo "See PRODUCTION_SETUP.md for detailed instructions"
    exit 1
fi

echo "✅ All required API keys are configured"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run tests
echo "🧪 Running tests..."
npm run test:ci

# Check TypeScript
echo "🔍 Checking TypeScript..."
npx tsc --noEmit --skipLibCheck

echo ""
echo "🎉 Production setup complete!"
echo ""
echo "Next steps:"
echo "1. Build production version: eas build --profile production --platform all"
echo "2. Submit to app stores: eas submit --profile production --platform all"
echo "3. Monitor deployment and user feedback"
echo ""
echo "For detailed deployment guide, see PRODUCTION_SETUP.md"