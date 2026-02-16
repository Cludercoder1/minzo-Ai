# 🚀 QUICK START - MinzoAI Localhost

## ✅ Server Status: RUNNING

Your AI server is live on **http://localhost:3001**

---

## 🎯 Quick Tests

### 1. Test Romantic Response
```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Tumhari smile meri day ban jati hai"}'
```
**Expected**: Romantic response in Hinglish

---

### 2. Test Content Moderation (Blocked)
```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"kill yourself"}'
```
**Expected**: BLOCKED with mental health resources

---

### 3. Test Normal Chat
```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What is artificial intelligence?"}'
```
**Expected**: AI response with web search

---

### 4. Get Statistics
```bash
curl http://localhost:3001/api/romantic/stats
curl http://localhost:3001/api/moderation/stats
curl http://localhost:3001/api/statistics
```

---

## 📱 Integration Examples

### JavaScript
```javascript
async function chat(message) {
  const res = await fetch('http://localhost:3001/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  });
  return res.json();
}

// Test
const response = await chat('Tumhari smile meri day ban jati hai');
console.log(response.response);
```

### Python
```python
import requests

response = requests.post('http://localhost:3001/api/chat', json={
    'message': 'How are you?'
})

print(response.json()['response'])
```

### HTML/React
```javascript
const [response, setResponse] = useState('');

const sendMessage = async (message) => {
  const res = await fetch('http://localhost:3001/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  });
  const data = await res.json();
  setResponse(data.response);
};
```

---

## 🎯 Key Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/chat` | POST | Main chat endpoint |
| `/api/romantic` | POST | Romantic detection |
| `/api/romantic/stats` | GET | Romantic statistics |
| `/api/moderation/stats` | GET | Moderation statistics |
| `/api/moderation/check` | POST | Check content |

---

## 💡 Response Types

### Romantic Response
```json
{
  "success": true,
  "response": "Tumhara pyaar hi meri smile ka reason hai",
  "isRomantic": true,
  "category": "compliments",
  "matchScore": 1.0
}
```

### Blocked Content
```json
{
  "success": true,
  "response": "I can't engage with that content...",
  "blocked": true,
  "severity": "critical"
}
```

### Normal Response
```json
{
  "success": true,
  "response": "Artificial Intelligence (AI) refers to...",
  "isRomantic": false,
  "source": "knowledge_base",
  "confidence": 0.9
}
```

---

## 🔄 Server Control

### Start Server
```bash
cd backend
node server.js
```

### Stop Server
Press `Ctrl+C` in the terminal

### Check if Running
```bash
netstat -ano | findstr :3001
```

---

## 📊 Features Overview

✅ **Content Moderation**
- Blocks harmful content
- Educates users
- Logs flagged items

✅ **Romantic Responses**
- 41 trained exchanges
- Hinglish support
- 9 categories

✅ **AI Chat**
- Web search
- Self-learning
- 450+ topics

---

## 🎉 You're All Set!

Your MinzoAI system is:
- ✅ Running on localhost:3001
- ✅ All features integrated
- ✅ Ready for testing
- ✅ Production-ready

Start chatting now! 🚀
