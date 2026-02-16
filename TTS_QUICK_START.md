# TTS Quick Start Guide

## 🚀 Get Running in 5 Minutes

### Step 1: Install TTS Library (1 minute)

```bash
cd backend/python_image_service
pip install TTS
```

Or update existing requirements:
```bash
pip install -r requirements.txt
```

### Step 2: Start Python Service (1 minute)

```bash
cd backend/python_image_service
python main.py
```

Wait for output:
```
INFO:     Uvicorn running on http://0.0.0.0:5001
```

### Step 3: Start Node.js Backend (1 minute)

In new terminal:
```bash
cd backend
npm install
npm start
```

Wait for output:
```
✓ Server running on port 3001
```

### Step 4: Start React Frontend (1 minute)

In new terminal:
```bash
cd client
npm install  
npm start
```

Browser opens to `http://localhost:3000`

### Step 5: Test TTS (1 minute)

In browser console:
```javascript
fetch('http://localhost:3001/api/tts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: 'Hello, I am Minzo. How are you?' })
})
.then(r => r.json())
.then(d => new Audio(d.audio).play())
.catch(e => console.log('Error:', e));
```

**That's it! You should hear audio playing.** 🎉

---

## 📝 Use in Your Code

### Method 1: Simple Playback

```javascript
import ttsService from './services/ttsService';

// Speak text
async function speakText(text) {
  await ttsService.synthesizeAndPlay(text);
}

speakText('Welcome to Minzo!');
```

### Method 2: With UI Component

```javascript
import TTSControl from './components/TTSControl';

export default function ChatResponse({ message }) {
  return (
    <div>
      <p>{message}</p>
      <TTSControl text={message} />
    </div>
  );
}
```

### Method 3: Auto-play on Response

```javascript
useEffect(() => {
  if (aiResponse) {
    ttsService.synthesizeAndPlay(aiResponse);
  }
}, [aiResponse]);
```

---

## 🔧 Environment Setup (Optional)

Create `.env` in root:
```
REACT_APP_BACKEND_URL=http://localhost:3001
```

---

## ⚡ Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| Python module not found | `pip install TTS` |
| Port 5001 already in use | `netstat -ano \| find "5001"` or use different port |
| Audio doesn't play | Check browser console for CORS errors |
| No audio after 30 seconds | Download model with `python -c "from TTS.api import TTS; TTS(model_name='tts_models/en/ek1/tacotron2')"` |
| "Service unavailable" | Make sure Python service is running on port 5001 |

---

## 📚 Next: Full Documentation

See `TTS_SETUP.md` for:
- Complete API documentation
- Advanced configuration
- Performance optimization
- Security best practices
- Troubleshooting guide

---

## 🎯 Integration Checklist

- [ ] Python TTS service running
- [ ] Node.js backend running
- [ ] React frontend running
- [ ] Test audio plays in browser
- [ ] Add TTSControl to a component
- [ ] Test from user interaction
- [ ] Deploy to production

**Questions?** Check the detailed guide in `TTS_SETUP.md`
