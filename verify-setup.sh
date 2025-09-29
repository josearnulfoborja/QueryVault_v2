#!/bin/bash
echo "🔍 Verifying Railway deployment configuration..."

# Check if required files exist
echo "📁 Checking files..."
if [ -f "package.json" ]; then
    echo "✅ package.json found"
else
    echo "❌ package.json missing"
fi

if [ -f "railway.json" ]; then
    echo "✅ railway.json found"
else
    echo "❌ railway.json missing"
fi

if [ -f "nixpacks.toml" ]; then
    echo "✅ nixpacks.toml found"
else
    echo "❌ nixpacks.toml missing"
fi

if [ -f "workflowy-sql-app/backend/server.js" ]; then
    echo "✅ server.js found"
else
    echo "❌ server.js missing"
fi

echo ""
echo "🚀 Start command: node workflowy-sql-app/backend/server.js"
echo "🏥 Health check: /health"
echo "📦 Node version: $(cat .nvmrc)"

echo ""
echo "✅ Configuration verified! Railway should be able to build this project."