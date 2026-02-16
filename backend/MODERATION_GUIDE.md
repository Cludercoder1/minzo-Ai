# 🛡️ Content Moderation System

Your AI now has intelligent content filtering that:
- ✅ **Detects** harmful patterns
- 🚫 **Blocks** critical/high-severity content
- ⚠️ **Flags** medium-severity content for moderators
- 📚 **Educates** users about inappropriate language
- 🚀 **Allows** safe, respectful content

## Features

### 1. Automatic Detection
Detects and categorizes harmful content:
- **Self-Harm**: "kill yourself", "kys", etc.
- **Hate Speech**: hate-based language
- **Harassment**: insulting/bullying language
- **Profanity**: inappropriate language

### 2. Severity Levels
- 🔴 **Critical**: Block immediately, offer help resources
- 🟠 **High**: Block, educational response
- 🟡 **Medium**: Flag for moderators, allow AI response
- 🟢 **Low**: Flag, allow normal response

### 3. Educational Responses
Instead of abusing back, your AI:
- Explains why the language is inappropriate
- Encourages respectful communication
- Provides mental health resources for critical cases
- Suggests rephrasing in a constructive way

### 4. Moderation Dashboard
Track flagged content:
- Total flagged messages
- Breakdown by severity and category
- Recent flagged items for review
- User-specific patterns

## Integration

Add this to your `backend/server.js`:

```javascript
const ContentModerator = require('./src/services/moderation');
const moderationRoutes = require('./src/routes/moderation');

// After app initialization
const moderator = new ContentModerator(path.join(__dirname, 'data'));

// Add moderation routes
app.use('/api/moderation', moderationRoutes(moderator));
```

## API Endpoints

### Check Content
```bash
POST /api/moderation/check
Content-Type: application/json

{
  "text": "User message here",
  "userId": "user123"
}

Response:
{
  "success": true,
  "isAllowed": false,
  "action": "BLOCK",
  "response": "I can't engage with that content...",
  "analysis": {
    "isHarmful": true,
    "severity": "critical",
    "flags": [{ "category": "self_harm", "severity": "critical" }]
  }
}
```

### Analyze Content
```bash
POST /api/moderation/analyze
Content-Type: application/json

{
  "text": "Sample content"
}
```

### Get Moderation Stats
```bash
GET /api/moderation/stats

Response:
{
  "success": true,
  "stats": {
    "totalFlagged": 42,
    "critical": 5,
    "high": 12,
    "medium": 25,
    "lastUpdated": "2025-12-26T...",
    "recentFlags": [...]
  }
}
```

### Get Flagged Content
```bash
GET /api/moderation/flagged?severity=critical&limit=10

Query Parameters:
- severity: critical | high | medium | low
- category: self_harm | hate_speech | harassment | profanity
- limit: number of results (default: all)
```

### Add Custom Pattern
```bash
POST /api/moderation/pattern
Content-Type: application/json

{
  "pattern": "word1|word2",
  "severity": "high",
  "category": "harassment"
}
```

## Usage in Chat

```javascript
// In your chat endpoint
const { text, userId } = req.body;

// Check content first
const moderation = moderator.processUserInput(text, userId);

if (moderation.action === 'BLOCK') {
    // Severe content - don't process, return educational response
    return res.json({
        response: moderation.response,
        blocked: true
    });
}

if (moderation.action === 'FLAG') {
    // Flag for review but allow AI to respond
    console.log('⚠️ Flagged:', text);
}

// Safe content - proceed with normal AI processing
const aiResponse = await yourAI.respond(text);
res.json({ response: aiResponse });
```

## Customization

### Add New Pattern
```javascript
moderator.addHarmfulPattern(
    'new(bad)?word|another-word',  // regex pattern
    'high',                          // severity
    'harassment'                     // category
);
```

### Change Confidence Threshold
```javascript
moderator.confidenceThreshold = 0.8;  // 0-1, higher = stricter
```

### Get Flagged Content for Review
```javascript
// All critical severity
const critical = moderator.getFlaggedContent({ severity: 'critical' });

// Specific category
const hateSpeech = moderator.getFlaggedContent({ category: 'hate_speech' });

// Recent 20 items
const recent = moderator.getFlaggedContent({ limit: 20 });
```

## Educational Messages

The system provides helpful, educational responses:

**Self-Harm:**
> I'm concerned about what you've said. If you're having thoughts of self-harm, please reach out to a mental health professional or crisis helpline.

**Hate Speech:**
> Hate speech is harmful and goes against respectful communication. Let's keep our conversation inclusive and kind.

**Harassment:**
> That language can be hurtful. I encourage respectful and constructive communication.

**Profanity:**
> I'd appreciate if we could keep our conversation family-friendly and respectful.

## Monitoring

Check the generated files:

**Flagged Content Log:**
```bash
cat data/flagged-content.json
```

**Recent Entries:**
```bash
tail -20 data/flagged-content.json
```

## Best Practices

1. **Review Flagged Content** - Check moderation stats regularly
2. **Update Patterns** - Add new harmful patterns as needed
3. **Adjust Severity** - Fine-tune what gets blocked vs flagged
4. **Monitor False Positives** - Ensure legitimate content isn't blocked
5. **Provide Resources** - Offer help for users in crisis

## Metrics

Your system tracks:
- ✅ Total messages flagged
- 📊 Distribution by severity level
- 📂 Categorization of harmful content
- 👤 User patterns (who sends harmful content)
- ⏰ Timestamp of all incidents

---

Your AI is now a safe, respectful conversational partner! 🎉
