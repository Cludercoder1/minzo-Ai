# ⚡ Quick Production Deployment Guide

## Option 1: Fastest - Run Immediately (Windows)

### Step 1: Update Backend URL
```powershell
# PowerShell (Windows)
.\setup-production.ps1 https://your-api.com
```

### Step 2: Test Locally
```bash
cd client/public
npx http-server -p 3000
```

### Step 3: Verify in Browser
- Open `http://localhost:3000`
- Open DevTools Console (F12)
- Check: `window.MINZO_BACKEND_URL` should show your production backend URL
- Test a chat message to verify API connection

### Step 4: Deploy
Copy `client/public/index.html` to your production web server

---

## Option 2: Express Server (Node.js)

### Step 1: Install Dependencies
```bash
npm install express cors
```

### Step 2: Create Production Server
```bash
# Run from root directory
node simple-server.js
```

The existing `simple-server.js` will serve on `http://localhost:3000`

### Step 3: Update Backend URL
Before running, update the meta tag in `client/public/index.html`:

```html
<!-- OLD (development) -->
<meta name="minzo-backend" content="%REACT_APP_BACKEND_URL%">

<!-- NEW (production) -->
<meta name="minzo-backend" content="https://your-api.com">
```

---

## Option 3: Python Simple Server

### One-liner:
```bash
cd client/public
python -m http.server 3000
```

Or if backend URL needs updating:
```bash
cd client/public
# Edit index.html first to update backend URL
python -m http.server 3000
```

---

## Option 4: Docker Deployment

### Step 1: Build Image
```bash
docker build -t minzo-frontend .
```

### Step 2: Run Container
```bash
docker run -p 3000:80 \
  -e REACT_APP_BACKEND_URL=https://your-api.com \
  minzo-frontend
```

Access at `http://localhost:3000`

---

## Option 5: Deploy to Vercel (Recommended)

### Step 1: Install Vercel CLI
```bash
npm i -g vercel
```

### Step 2: Add vercel.json
```json
{
  "buildCommand": "echo 'Frontend only - no build needed'",
  "outputDirectory": "client/public",
  "env": {
    "REACT_APP_BACKEND_URL": "https://your-api.com"
  }
}
```

### Step 3: Deploy
```bash
vercel --prod
```

---

## Manual Configuration (No Scripts)

### Edit `client/public/index.html` directly:

Find this line (around line 20):
```html
<meta name="minzo-backend" content="%REACT_APP_BACKEND_URL%">
```

Replace with your production URL:
```html
<meta name="minzo-backend" content="https://api.yourdomain.com">
```

Save and deploy the modified file.

---

## ✅ Verification Checklist

After deployment, verify these work:

- [ ] Frontend loads without errors (DevTools Console)
- [ ] `window.MINZO_BACKEND_URL` shows correct production URL
- [ ] Can send a chat message (GET to `/api/chat`)
- [ ] Can see response from backend
- [ ] Dark/Light theme toggle works
- [ ] Sidebar toggles smoothly
- [ ] 3D particles load (check Network tab for Three.js CDN)
- [ ] localStorage saves chat history
- [ ] Login/signup buttons visible
- [ ] Can create new chat session

---

## 🔧 Environment Variables

### For Different Hosting Platforms:

**Vercel/Netlify:**
```
REACT_APP_BACKEND_URL=https://api.yourdomain.com
```

**AWS/Heroku:**
```
REACT_APP_BACKEND_URL=https://your-backend.herokuapp.com
```

**Custom Domain:**
```
REACT_APP_BACKEND_URL=https://api.minzoai.com
```

**Docker:**
```bash
docker run -e REACT_APP_BACKEND_URL=https://api.com minzo-frontend
```

---

## 🚨 Common Issues & Fixes

### Backend URL Not Detected
```javascript
// In browser console, check:
window.MINZO_BACKEND_URL
// Should output: https://api.yourdomain.com (NOT localhost:3001)
```

### CORS Errors
Ensure backend has these headers:
```
Access-Control-Allow-Origin: https://your-frontend.com
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

### 404 on API Calls
- Check that `/api/chat`, `/api/login`, etc. exist on your backend
- Verify backend is running and accessible
- Check Network tab in DevTools for actual URLs being called

### localStorage Not Working
Check browser console for:
```
Unchecked runtime.lastError: ...
```
May need to clear localStorage and refresh.

---

## 📊 Performance Tips

1. **Enable GZIP Compression** on your server
2. **Use a CDN** for static assets (already using Cloudflare for CDN libs)
3. **Enable caching** for index.html (set Cache-Control headers)
4. **Use HTTPS** in production (improves Core Web Vitals)
5. **Monitor performance** with Lighthouse (Google PageSpeed Insights)

---

## 🔐 Security Checklist

- [ ] Using HTTPS (not HTTP) in production
- [ ] Backend URL is using your domain (not 3rd party)
- [ ] CORS is properly configured to frontend domain
- [ ] No API keys exposed in frontend code
- [ ] Authentication tokens stored securely (already in localStorage)
- [ ] CSP headers configured on server
- [ ] X-Frame-Options set to prevent clickjacking
- [ ] SSL certificate is valid and up-to-date

---

## 📞 Support

If deployment fails:

1. Check `client/public/index.html` was properly updated
2. Verify backend is running and accessible from frontend domain
3. Check browser DevTools Console for errors
4. Check Network tab for API response status codes
5. Verify CORS headers in backend responses

