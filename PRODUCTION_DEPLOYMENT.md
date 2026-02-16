# MinzoAI Production Deployment Guide

## Option 1: Update Meta Tag in HTML (Recommended for Quick Deployment)

The easiest way to point to your production backend is to update the `meta` tag in `client/public/index.html`:

**Current (Local):**
```html
<meta name="minzo-backend" content="%REACT_APP_BACKEND_URL%">
```

**For Production - Replace with your production backend URL:**
```html
<meta name="minzo-backend" content="https://your-production-backend.com">
```

Example for different deployments:
- AWS: `<meta name="minzo-backend" content="https://api.minzoai.com">`
- Heroku: `<meta name="minzo-backend" content="https://minzoai-backend.herokuapp.com">`
- Custom Domain: `<meta name="minzo-backend" content="https://backend.yourdomain.com">`

---

## Option 2: Inject Backend URL at Runtime (Best for Dynamic Deployments)

Add this script before the main script tag in `client/public/index.html`:

```html
<!-- Set backend URL based on environment -->
<script>
  // This will be overridden by the meta tag or environment variable
  window.__MINZO_BACKEND_URL__ = 'https://your-production-backend.com';
</script>
```

---

## Option 3: Build React for Production

If you're using the React build system:

```bash
cd client
npm run build
```

This creates an optimized production build in `client/build/`.

Set environment variable before build:
```bash
REACT_APP_BACKEND_URL=https://your-production-backend.com npm run build
```

---

## Option 4: Serve HTML Directly with a Simple Server

### Using Node.js Simple Server:

Create `server.js` in your project root:

```javascript
const express = require('express');
const path = require('path');
const app = express();

// Serve static files from client/public
app.use(express.static(path.join(__dirname, 'client/public')));

// Serve index.html for all routes (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/public/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Frontend server running on http://localhost:${PORT}`);
  console.log(`Backend: ${process.env.MINZO_BACKEND_URL || 'http://localhost:3001'}`);
});
```

Run it:
```bash
MINZO_BACKEND_URL=https://your-production-backend.com node server.js
```

### Using Python Simple Server:

```bash
cd client/public
python -m http.server 3000
```

### Using npx http-server:

```bash
cd client/public
npx http-server -p 3000
```

---

## Production Deployment Checklist

- [ ] Update backend URL in meta tag or environment variable
- [ ] Test all API endpoints work with production backend
- [ ] Verify CORS is enabled on your production backend
- [ ] Enable HTTPS for production
- [ ] Test authentication flow (Sign in, Sign up, OAuth)
- [ ] Test chat functionality with production AI endpoints
- [ ] Test image generation (if applicable)
- [ ] Verify localStorage works in production
- [ ] Test on mobile and different browsers
- [ ] Set up monitoring/logging for errors
- [ ] Configure CDN if needed for faster asset delivery
- [ ] Set up SSL/TLS certificates

---

## Environment Variables for Different Platforms

### Vercel
```
REACT_APP_BACKEND_URL=https://your-backend.com
```

### Netlify
```
REACT_APP_BACKEND_URL=https://your-backend.com
```

### Docker
```dockerfile
ENV REACT_APP_BACKEND_URL=https://your-backend.com
```

### GitHub Pages (if using)
Set in build workflow or environment settings.

---

## Testing Production Deployment Locally

Before deploying, test locally with production URL:

```bash
# In client/public/index.html, change:
<meta name="minzo-backend" content="https://your-production-backend.com">

# Then serve:
cd client/public
npx http-server -p 3000
```

Visit `http://localhost:3000` and verify all features work.

---

## Troubleshooting

**Issue**: CORS errors when calling backend
- **Solution**: Ensure your production backend has CORS enabled for your frontend domain

**Issue**: Backend URL not detected
- **Solution**: Check browser console for `window.MINZO_BACKEND_URL` value
  ```javascript
  console.log(window.MINZO_BACKEND_URL)
  ```

**Issue**: Authentication not working
- **Solution**: Verify OAuth redirect URIs match production domain in your OAuth provider settings

**Issue**: API calls failing but no error message
- **Solution**: Check Network tab in DevTools to see actual requests and responses
