# Real Image Generation Setup Guide

Your MinzoAI now supports **real image generation** from multiple providers! 🎨

## How It Works

The system automatically tries these providers in order:
1. **Unsplash** - Professional photography (API Key recommended)
2. **Pexels** - Free stock photos (No key needed, but can set one)
3. **Pixabay** - Large image library (API Key needed)
4. **Hugging Face** - AI-generated images (API Key needed)
5. **Fallback** - SVG placeholder generation

## Getting API Keys

### 1. Unsplash (⭐ Recommended - Best Quality)
- Visit: https://unsplash.com/oauth/applications
- Click "Create application"
- Accept terms
- Copy the "Access Key"
- This key is free and has a generous rate limit

### 2. Pixabay (Free Alternative)
- Visit: https://pixabay.com/api/docs/
- Click "Display your API Key"
- Copy the API key
- Free account with 100 requests/day

### 3. Pexels (Optional)
- Visit: https://www.pexels.com/api/
- Click "Generate"
- Copy the API key
- Not required as Pexels works without key

### 4. Hugging Face (For AI-Generated Images)
- Visit: https://huggingface.co/settings/tokens
- Click "New token"
- Select "read" access
- Copy the token
- Uses Stable Diffusion v2 model

## Configuration Methods

### Method 1: Environment Variables (Recommended)
```bash
# Windows PowerShell
$env:UNSPLASH_API_KEY = "your_key_here"
$env:PIXABAY_API_KEY = "your_key_here"
$env:HUGGINGFACE_API_KEY = "your_key_here"

# Or add to .env file in backend folder
UNSPLASH_API_KEY=your_key_here
PIXABAY_API_KEY=your_key_here
HUGGINGFACE_API_KEY=your_key_here
```

### Method 2: API Endpoint
```bash
curl -X POST http://localhost:3001/api/config/image-keys \
  -H "Content-Type: application/json" \
  -d '{
    "unsplash": "your_unsplash_key",
    "pixabay": "your_pixabay_key",
    "huggingface": "your_huggingface_key"
  }'
```

### Method 3: JavaScript (In App)
```javascript
fetch('http://localhost:3001/api/config/image-keys', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    unsplash: 'your_key_here',
    pixabay: 'your_key_here'
  })
});
```

## Testing Real Image Generation

### Via Chat (Built-in)
Just say things like:
- "Generate a beautiful sunset"
- "Create an image of mountains"
- "Draw a forest landscape"
- "Show me a beach photo"

The system will automatically generate 3 real images!

### Via API
```bash
# Get real images
curl -X POST http://localhost:3001/api/image/generate-real \
  -H "Content-Type: application/json" \
  -d '{"prompt": "beautiful sunset", "count": 3}'

# Check stats
curl http://localhost:3001/api/image/real-stats
```

## Image Flow

```
User: "Generate a sunset"
         ↓
    Content Moderation ✅
         ↓
    Romantic Check ❌
         ↓
    Image Generation Detected ✅
         ↓
    RealImageGenerator Initializes
         ↓
    ┌─────────────────────────────┐
    │ Try Each Provider in Order: │
    ├─────────────────────────────┤
    │ 1. Unsplash API             │
    │ 2. Pexels API               │
    │ 3. Pixabay API              │
    │ 4. Hugging Face             │
    │ 5. SVG Placeholder          │
    └─────────────────────────────┘
         ↓
    3 Real Images Generated
         ↓
    Images Cached for Speed
         ↓
    Frontend Displays in Gallery 🖼️
```

## Features

✅ **Real Photos** - High-quality stock images from multiple providers
✅ **Caching** - Previously generated images load instantly
✅ **Fallback** - Always shows something (SVG if APIs fail)
✅ **Auto-Detection** - Recognizes image requests in chat
✅ **Multi-Provider** - Tries different sources automatically
✅ **Statistics** - Track generations, cache hits, failures
✅ **No Dependencies** - Built into backend, no extra services

## Troubleshooting

### Images Not Generating?
1. Check if you're using the right keywords: "generate", "create", "draw", "show", "photo", "image"
2. Make sure prompt is more than 3 characters
3. Check server logs: `GET /api/image/real-stats` to see available providers

### Getting Placeholder SVGs Only?
- Your API keys might not be configured
- Try: `curl http://localhost:3001/api/image/real-stats`
- If "availableProviders" is empty, configure at least one key

### Rate Limiting?
- Unsplash: 50 requests/hour (free tier)
- Pexels: No official limit
- Pixabay: 100 requests/day (free tier)
- Use caching to reduce requests (same prompt = instant result)

### Images Showing in Chat But Not UI?
- Check browser console for errors
- Ensure images are properly formatted in response
- Try refreshing the page

## Performance Tips

1. **Use Unsplash** - Most reliable and beautiful
2. **Reuse Prompts** - Cached results are instant
3. **Specific Prompts** - "A blue sunset over the ocean" better than "sunset"
4. **Monitor Usage** - Check `/api/image/real-stats` regularly

## Example Prompts

Good prompts:
- "A serene mountain landscape at sunrise"
- "Modern urban architecture photography"
- "A cozy coffee shop interior"
- "Nature forest with flowing stream"
- "Abstract geometric art patterns"

## What's Next?

Once configured, just use the chat normally:
- Image requests are auto-detected ✨
- Results appear in your gallery 📸
- Everything works together seamlessly 🚀

Happy generating! 🎨
