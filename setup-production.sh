#!/bin/bash
# MinzoAI Production Setup Script

echo "🚀 MinzoAI Production Deployment Setup"
echo "======================================"

# Check if backend URL is provided
if [ -z "$1" ]; then
    echo "Usage: ./setup-production.sh <BACKEND_URL>"
    echo "Example: ./setup-production.sh https://api.minzoai.com"
    exit 1
fi

BACKEND_URL=$1
CLIENT_INDEX="client/public/index.html"

echo ""
echo "📝 Configuration:"
echo "  Backend URL: $BACKEND_URL"
echo "  Frontend File: $CLIENT_INDEX"
echo ""

# Check if file exists
if [ ! -f "$CLIENT_INDEX" ]; then
    echo "❌ Error: $CLIENT_INDEX not found"
    exit 1
fi

# Backup original file
cp "$CLIENT_INDEX" "$CLIENT_INDEX.backup"
echo "✅ Created backup: $CLIENT_INDEX.backup"

# Update the meta tag with production backend URL
sed -i "s|<meta name=\"minzo-backend\" content=\"%REACT_APP_BACKEND_URL%\">|<meta name=\"minzo-backend\" content=\"$BACKEND_URL\">|g" "$CLIENT_INDEX"

# Verify the change
if grep -q "content=\"$BACKEND_URL\"" "$CLIENT_INDEX"; then
    echo "✅ Backend URL updated successfully"
    echo "   Meta tag now points to: $BACKEND_URL"
else
    echo "⚠️  Could not verify update, please check manually"
fi

echo ""
echo "📦 Next Steps:"
echo "1. Test locally: cd client/public && npx http-server -p 3000"
echo "2. Verify in browser: http://localhost:3000"
echo "3. Check console: window.MINZO_BACKEND_URL should show: $BACKEND_URL"
echo "4. Deploy to production hosting"
echo ""
echo "🔄 To rollback to development:"
echo "   cp $CLIENT_INDEX.backup $CLIENT_INDEX"
echo ""
