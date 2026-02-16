# TTS (Text-to-Speech) Integration Guide

## Overview
Your MinzoAI project now integrates **Tacotron2** text-to-speech with Indian English voice support using the `TTS` library. The implementation includes:

- **Backend**: Python FastAPI service with Tacotron2 model
- **API Proxy**: Node.js Express routes forwarding requests  
- **Frontend**: React components and utilities for TTS control

---

## Architecture

```
React Frontend
    ↓
Node.js Backend API Routes (/api/tts, /api/tts/file)
    ↓
Python FastAPI Service (port 5001)
    ↓
TTS Model (tts_models/en/ek1/tacotron2)
    ↓
Audio Output (WAV format)
```

---

## Installation

### 1. Install Python Dependencies

Run this in the `backend/python_image_service/` directory:

```bash
cd backend/python_image_service
pip install -r requirements.txt
```

This installs:
- `TTS` - Text-to-speech library
- `FastAPI` - Web framework
- `uvicorn` - ASGI server
- `Pillow`, `requests`, `python-multipart` - Supporting libraries

The first time you run TTS, it will download the Tacotron2 model (~300MB) automatically.

### 2. Environment Variables (Optional)

Add to your `.env` file:

```bash
# Backend
TTS_SERVICE_URL=http://localhost:5001/tts
PYTHON_IMAGE_SERVICE_URL=http://localhost:5001

# Frontend
REACT_APP_BACKEND_URL=http://localhost:3001
```

---

## Running the Services

### Start Python TTS Service

```bash
cd backend/python_image_service
python main.py
```

Or with custom port:
```bash
uvicorn main:app --host 0.0.0.0 --port 5001 --reload
```

**Expected output:**
```
INFO:     Uvicorn running on http://0.0.0.0:5001
```

### Start Node.js Backend

```bash
cd backend
npm install
npm start
```

**Expected output:**
```
✓ Server running on port 3001
```

### Start React Frontend

```bash
cd client
npm install
npm start
```

Opens on `http://localhost:3000`

---

## API Endpoints

### 1. POST `/api/tts` - Base64 Audio

Returns audio as base64 in response body.

**Request:**
```json
{
  "text": "Hello, I am Minzo voice assistant",
  "language": "en"
}
```

**Response:**
```json
{
  "success": true,
  "audio": "data:audio/wav;base64,UklGRiYA...",
  "text": "Hello, I am Minzo voice assistant"
}
```

**Usage:**
```javascript
const response = await fetch('http://localhost:3001/api/tts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: 'Your text here' })
});

const { audio } = await response.json();
const audioElement = new Audio(audio);
audioElement.play();
```

### 2. POST `/api/tts/file` - WAV File Download

Returns audio file as WAV with download headers.

**Request:**
```json
{
  "text": "Download this as a file",
  "language": "en"
}
```

**Response:** WAV binary file with `Content-Disposition: attachment`

**Usage:**
```javascript
const response = await fetch('http://localhost:3001/api/tts/file', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: 'Your text here' })
});

const blob = await response.blob();
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'speech.wav';
a.click();
```

---

## Frontend Usage

### Option 1: Using TTSService Directly

```javascript
import ttsService from './services/ttsService';

// Synthesize and play
await ttsService.synthesizeAndPlay('Hello world');

// Just synthesize (returns base64)
const { audio } = await ttsService.synthesize('Hello world');

// Download as file
await ttsService.downloadAudio('Hello world', 'en', 'myfile.wav');

// Check if playing
if (ttsService.isCurrentlyPlaying()) {
  console.log('Audio is playing');
}

// Stop playback
ttsService.stop();

// Clear cache
ttsService.clearCache();
```

### Option 2: Using TTSControl Component

```javascript
import React from 'react';
import TTSControl from './components/TTSControl';

function MyComponent() {
  const responseText = 'This is the AI response';

  return (
    <div>
      <p>{responseText}</p>
      <TTSControl 
        text={responseText}
        label="Read Aloud"
        onPlay={() => console.log('Started playing')}
        onStop={() => console.log('Stopped playing')}
      />
    </div>
  );
}

export default MyComponent;
```

### Option 3: Full Example with TTSExample Component

```javascript
import TTSExample from './components/TTSExample';

function App() {
  return (
    <div>
      <TTSExample />
    </div>
  );
}
```

---

## Features

### ✅ Implemented Features

- ✓ Text-to-speech synthesis using Tacotron2
- ✓ Base64 audio response for web playback
- ✓ WAV file download capability
- ✓ Audio caching on frontend (avoid re-synthesis)
- ✓ Play/Stop controls
- ✓ Error handling with user feedback
- ✓ CORS enabled for cross-origin requests
- ✓ Timeout handling (60 seconds)

### 📋 Available Components

1. **ttsService** - Core service for TTS operations
2. **TTSControl** - UI component with play/stop/download buttons
3. **TTSExample** - Full-featured example component

---

## Configuration

### Model Selection

To use a different TTS model, edit `backend/python_image_service/main.py`:

```python
# Current (Tacotron2)
tts_model = TTS(model_name="tts_models/en/ek1/tacotron2", gpu=False)

# Alternative models:
# tts_model = TTS(model_name="tts_models/en/glow-tts", gpu=False)
# tts_model = TTS(model_name="tts_models/en/ljspeech/glow-tts", gpu=False)
```

### GPU Support

Enable GPU for faster synthesis:

```python
# In main.py
tts_model = TTS(model_name="tts_models/en/ek1/tacotron2", gpu=True)
```

Requires: CUDA and PyTorch GPU support

### Cache Settings

Configure cache behavior in `client/src/services/ttsService.js`:

```javascript
// Disable caching
// In synthesize() method, remove the cache check

// Or set cache limit
if (this.audioCache.size > 50) {
  // Clear old entries
}
```

---

## Troubleshooting

### Issue: Model download fails
```
Solution: Download manually:
python -c "from TTS.api import TTS; TTS(model_name='tts_models/en/ek1/tacotron2')"
```

### Issue: CUDA not available
```
Solution: Use CPU:
tts_model = TTS(model_name="tts_models/en/ek1/tacotron2", gpu=False)
```

### Issue: Audio doesn't play in browser
```
Solution: Check CORS headers and audio format:
- Ensure CORS middleware in Python service
- Audio should be WAV format (44100Hz)
- Try downloading file to verify quality
```

### Issue: Timeout on long text
```
Solution: Increase timeout in backend/server.js:
timeout: 120000  // 2 minutes
```

### Issue: "TTS model failed to initialize"
```
Solution:
1. Check pip install: pip list | grep TTS
2. Delete model cache: rm -rf ~/.local/share/tts_models/
3. Reinstall: pip install --upgrade TTS
```

---

## Performance Tips

1. **Cache enabled by default** - First request slow, subsequent requests instant
2. **Batch synthesis** - Group short texts into single synthesis
3. **Use WAV format** - Smaller than MP3 for short audio
4. **CPU sufficient** - GPU not needed for reasonable latency (~2-5 seconds per 100 words)
5. **Model loading once** - Minimize service restarts

---

## Integration Examples

### Example 1: AI Chat with Voice Response

```javascript
// In your chat component
const [messages, setMessages] = useState([]);

const handleSendMessage = async (userText) => {
  // Send to AI
  const aiResponse = await getAIResponse(userText);
  
  // Add to chat
  setMessages([...messages, { role: 'user', text: userText }]);
  setMessages(prev => [...prev, { role: 'ai', text: aiResponse }]);
  
  // Auto-play AI response
  await ttsService.synthesizeAndPlay(aiResponse);
};
```

### Example 2: Response with Both Text and Voice

```javascript
function AIResponse({ responseText }) {
  return (
    <div className="response-box">
      <p>{responseText}</p>
      <TTSControl 
        text={responseText}
        label="Hear Response"
      />
    </div>
  );
}
```

### Example 3: Auto-read on Load

```javascript
useEffect(() => {
  if (aiResponse) {
    // Auto-play on new response
    ttsService.synthesizeAndPlay(aiResponse).catch(console.error);
  }
}, [aiResponse]);
```

---

## Advanced Usage

### Custom Playback Handler

```javascript
const { audio } = await ttsService.synthesize('Text');

const customAudio = new Audio(audio);
customAudio.onended = () => {
  console.log('Playback finished');
  // Trigger next action
};
customAudio.play();
```

### Streaming to Server

```javascript
// Convert WAV to stream and send
const blob = await (await fetch(audioDataUrl)).blob();
await uploadAudio(blob);
```

### Pre-cache Important Phrases

```javascript
// During app initialization
const importantPhrases = [
  'Hello, I am Minzo',
  'How can I help you today?',
  'Thank you for using Minzo'
];

for (const phrase of importantPhrases) {
  await ttsService.synthesize(phrase);
}
```

---

## Security Considerations

1. **Input Validation** - Backend validates text length
2. **Rate Limiting** - Add rate limit middleware for /api/tts
3. **CORS** - Currently allows all origins, restrict in production:
   ```python
   allow_origins=["https://yourdomain.com"]
   ```
4. **API Key** - Add authentication to TTS endpoints
5. **Text Size** - Limit input length to prevent abuse

---

## Testing

### Test TTS Python Service Directly

```bash
curl -X POST http://localhost:5001/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world"}'
```

### Test Node.js Proxy

```bash
curl -X POST http://localhost:3001/api/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello from Node"}'
```

### Test in Browser Console

```javascript
fetch('http://localhost:3001/api/tts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: 'Test audio' })
})
.then(r => r.json())
.then(data => new Audio(data.audio).play());
```

---

## Files Changed/Added

### New Files
- `backend/python_image_service/main.py` - TTS endpoints
- `client/src/services/ttsService.js` - TTS service class
- `client/src/components/TTSControl.js` - Control component
- `client/src/components/TTSExample.js` - Example implementation
- `TTS_SETUP.md` - This guide

### Modified Files
- `backend/python_image_service/requirements.txt` - Added TTS
- `backend/server.js` - Added /api/tts routes

---

## Next Steps

1. ✅ Install dependencies: `pip install -r requirements.txt`
2. ✅ Start Python service: `python main.py` (port 5001)
3. ✅ Start Node.js backend: `npm start` (port 3001)
4. ✅ Start React frontend: `npm start` (port 3000)
5. ✅ Test with TTSExample component
6. ✅ Integrate into your AI chat interface
7. ✅ Deploy to production

---

## Support & Resources

- **TTS Library**: https://github.com/coqui-ai/TTS
- **Tacotron2 Model**: https://github.com/coqui-ai/TTS#models
- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **Issues**: Check backend logs for detailed error messages

---

**Happy voice assisting!** 🎤✨
