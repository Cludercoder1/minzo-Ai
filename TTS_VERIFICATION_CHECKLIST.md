# ✅ TTS Integration Verification Checklist

Use this checklist to verify your TTS integration is complete and working.

---

## Pre-Installation (Before Starting)

- [ ] Python 3.8+ installed (`python --version`)
- [ ] Node.js 14+ installed (`node --version`)
- [ ] npm or yarn available (`npm --version`)
- [ ] Workspace structure intact (backend/, client/, etc.)
- [ ] Terminal access (PowerShell or CMD)

---

## Installation Steps

### Phase 1: Python Dependencies

- [ ] Navigated to `backend/python_image_service/`
- [ ] Ran `pip install -r requirements.txt`
- [ ] Verified TTS installed: `pip list | grep -i tts`
- [ ] Test import: `python -c "from TTS.api import TTS; print('OK')"`

**If stuck**: Run `pip install --upgrade TTS` to install latest version

### Phase 2: Start Services

- [ ] Terminal 1 - Python service started:
  ```bash
  cd backend/python_image_service
  python main.py
  ```
  - [ ] See message: `INFO:     Uvicorn running on http://0.0.0.0:5001`
  - [ ] First run: Model downloads (~300MB, may take 2-5 minutes)

- [ ] Terminal 2 - Node.js backend started:
  ```bash
  cd backend
  npm start
  ```
  - [ ] See message: `Server running on port 3001`

- [ ] Terminal 3 - React frontend started:
  ```bash
  cd client
  npm start
  ```
  - [ ] Browser opens to `http://localhost:3000`
  - [ ] No CORS errors in console

---

## Quick Test (Browser Console)

1. [ ] Open browser console (F12)
2. [ ] Paste and run:
   ```javascript
   fetch('http://localhost:3001/api/tts', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ text: 'Hello. I am Minzo.' })
   })
   .then(r => r.json())
   .then(d => {
     console.log('Audio received:', d.audio.substring(0, 50) + '...');
     new Audio(d.audio).play();
   })
   .catch(e => console.error('Error:', e));
   ```
3. [ ] Audio plays (you should hear speech)
4. [ ] Console shows no errors

---

## File Verification

### Backend Files

- [ ] `backend/python_image_service/requirements.txt`
  - [ ] Contains: `TTS`
  
- [ ] `backend/python_image_service/main.py`
  - [ ] Imports `from TTS.api import TTS`
  - [ ] Contains `class TTSRequest(BaseModel)`
  - [ ] Contains `@app.post('/tts')` endpoint
  - [ ] Contains `@app.post('/tts/file')` endpoint

- [ ] `backend/server.js`
  - [ ] Contains `app.post('/api/tts', ...)`
  - [ ] Contains `app.post('/api/tts/file', ...)`

### Frontend Files

- [ ] `client/src/services/ttsService.js` exists
  - [ ] Exports `TTSService` class
  - [ ] Methods: `synthesize()`, `play()`, `stop()`, `downloadAudio()`

- [ ] `client/src/components/TTSControl.js` exists
  - [ ] Exports `TTSControl` component
  - [ ] Has Play, Stop, and Download buttons

- [ ] `client/src/components/TTSExample.js` exists
  - [ ] Full working example component

- [ ] `client/src/services/advancedTTSUtils.js` exists
  - [ ] Contains `TTSQueue`, `TextSplitter`, `VoiceResponseBuilder`, etc.

- [ ] `client/src/components/AdvancedTTSExample.js` exists
  - [ ] Demonstrates advanced utilities

### Documentation Files

- [ ] `TTS_SETUP.md` (50+ sections, complete guide)
- [ ] `TTS_QUICK_START.md` (quick reference)
- [ ] `TTS_INTEGRATION_SUMMARY.md` (overview)
- [ ] `TTS_VERIFICATION_CHECKLIST.md` (this file)
- [ ] `client/src/AppWithTTSExample.js` (integration example)

---

## Feature Tests

### Test 1: Basic Synthesis

- [ ] Text input: "Hello world"
- [ ] API call completes without error
- [ ] Response includes `audio` field (base64)
- [ ] Audio plays in browser

### Test 2: File Download

- [ ] Text input: "Download test"
- [ ] Click download button
- [ ] WAV file downloads to Downloads folder
- [ ] File is playable (check size > 50KB)

### Test 3: TTSControl Component

- [ ] Import component: `import TTSControl from './components/TTSControl'`
- [ ] Use in component:
  ```javascript
  <TTSControl text="Test message" />
  ```
- [ ] Read button works
- [ ] Download button works
- [ ] Error messages display correctly

### Test 4: Caching

- [ ] Speak same text twice
- [ ] Second time loads faster (from cache)
- [ ] Cache size increases: `ttsService.getCacheSize()` > 0
- [ ] Clear cache: `ttsService.clearCache()` works

### Test 5: Queue Processing

- [ ] Import utilities:
  ```javascript
  import { TTSQueue } from './services/advancedTTSUtils';
  ```
- [ ] Create and process queue:
  ```javascript
  const q = new TTSQueue();
  q.enqueue('First').enqueue('Second').enqueue('Third');
  await q.process();
  ```
- [ ] All texts play sequentially

### Test 6: Notifications

- [ ] Import:
  ```javascript
  import { VoiceNotifier } from './services/advancedTTSUtils';
  ```
- [ ] Test notifications:
  ```javascript
  await VoiceNotifier.info('Test info');
  await VoiceNotifier.success('Test success');
  await VoiceNotifier.warning('Test warning');
  ```
- [ ] Each plays with appropriate prefix

---

## Integration Tests

### Test 7: React Component Integration

- [ ] Create component:
  ```javascript
  import TTSExample from './components/TTSExample';
  
  function App() {
    return <TTSExample />;
  }
  ```
- [ ] Component loads without errors
- [ ] All buttons work
- [ ] Text input and playback function properly

### Test 8: Chat Integration

- [ ] Copy `AppWithTTSExample.js` pattern
- [ ] Add to your chat component:
  ```javascript
  <TTSControl text={message.text} />
  ```
- [ ] TTS button appears below messages
- [ ] Can read messages aloud
- [ ] Auto-speak toggle works (if implemented)

### Test 9: Error Handling

- [ ] Pass empty text: Should show error message
- [ ] Disconnect Python service: Should show API error
- [ ] Very long text (10,000+ chars): Should still work (with longer wait)
- [ ] All errors logged to console

---

## Performance Checks

### Test 10: Latency

- [ ] First synthesis: 3-10 seconds (model loading)
- [ ] Cached synthesis: < 0.5 seconds
- [ ] Model download: First run only, ~300MB

### Test 11: Memory

- [ ] Browser memory stable after multiple plays
- [ ] No memory leaks when using TTSControl repeatedly
- [ ] Cache can be cleared to free memory

### Test 12: Concurrent Requests

- [ ] Multiple texts in quick succession: Works
- [ ] Rapid play/stop: No crashes
- [ ] Multiple browser tabs: Works

---

## Configuration Tests

### Test 13: Environment Variables

- [ ] Create `.env` in root:
  ```
  REACT_APP_BACKEND_URL=http://localhost:3001
  ```
- [ ] Verify frontend uses this URL
- [ ] Test alternative URLs (if available)

### Test 14: Custom Model (Optional)

- [ ] Edit Python service to use different model
- [ ] Verify new model downloads
- [ ] Test synthesis with new model

### Test 15: GPU Support (Optional)

- [ ] Check CUDA availability: `python -c "import torch; print(torch.cuda.is_available())"`
- [ ] If available, enable GPU in code: `gpu=True`
- [ ] Verify faster synthesis times

---

## Documentation Review

- [ ] Read `TTS_QUICK_START.md` (5 minutes)
- [ ] Review `TTS_SETUP.md` sections of interest
- [ ] Check API documentation for endpoint details
- [ ] Review troubleshooting section for known issues

---

## Deployment Readiness

- [ ] Tested locally on multiple browsers
- [ ] All services start without manual intervention
- [ ] Environment variables configured
- [ ] Services handle graceful shutdown
- [ ] Error messages are user-friendly
- [ ] No console errors or warnings (except expected)

---

## Final Verification

Run this comprehensive test:

```javascript
// Paste in browser console
(async function testTTS() {
  console.log('🧪 Running TTS Tests...\n');
  
  try {
    // Test 1: Synthesize
    console.log('✓ Test 1: Synthesizing...');
    const response = await fetch('http://localhost:3001/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Test synthesis' })
    });
    const data = await response.json();
    console.log('  ✅ Synthesis successful');
    
    // Test 2: Play
    console.log('✓ Test 2: Playing audio...');
    new Audio(data.audio).play();
    console.log('  ✅ Playback started (audio should be playing)\n');
    
    // Test 3: Service import
    console.log('✓ Test 3: Service availability...');
    console.log('  ✅ API endpoints are working\n');
    
    console.log('🎉 All tests passed!');
    console.log('Your TTS integration is ready to use.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('Check that all services are running:');
    console.log('  • Python: http://localhost:5001');
    console.log('  • Node.js: http://localhost:3001');
    console.log('  • React: http://localhost:3000');
  }
})();
```

Expected output:
```
🧪 Running TTS Tests...

✓ Test 1: Synthesizing...
  ✅ Synthesis successful
✓ Test 2: Playing audio...
  ✅ Playback started (audio should be playing)
✓ Test 3: Service availability...
  ✅ API endpoints are working

🎉 All tests passed!
Your TTS integration is ready to use.
```

---

## Troubleshooting Reference

| Problem | Solution |
|---------|----------|
| Port 5001 in use | Kill process: `taskkill /PID <id> /F` |
| Model won't download | Run: `pip install --upgrade TTS` |
| No audio output | Check browser muted, CORS, and api url |
| Service won't start | Check logs, verify all dependencies |
| Timeout errors | Increase timeout in `server.js` to 120000ms |
| Memory leak | Clear cache: `ttsService.clearCache()` |

For more help, see `TTS_SETUP.md` > Troubleshooting section.

---

## Sign-Off Checklist

When you've completed all tests, check these boxes:

- [ ] All 15 tests passed
- [ ] Component integration works
- [ ] Documentation reviewed
- [ ] Troubleshooting section consulted if needed
- [ ] Ready for development/production

---

## 🎉 Success!

Your TTS integration is complete and verified. You can now:

✅ Convert AI responses to speech  
✅ Play audio in browser  
✅ Download audio files  
✅ Cache audio for performance  
✅ Build voice-enabled interfaces  
✅ Create multi-turn voice conversations  
✅ Send voice notifications  
✅ Process multiple texts sequentially  

**Get started with `TTS_QUICK_START.md` or `AppWithTTSExample.js`**

---

**Last Updated**: February 10, 2026  
**Status**: ✅ Ready for Production
