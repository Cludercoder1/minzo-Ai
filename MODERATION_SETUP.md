# 🛡️ Content Moderation System - Complete Setup

Your AI now has a safe, educational content moderation system that **educates users instead of engaging with harmful content**.

## What Was Created

### 1. **Core Moderation Engine** (`src/services/moderation.js`)
- Detects harmful patterns automatically
- Categorizes by severity (critical, high, medium, low)
- Logs flagged content for review
- Provides educational responses

### 2. **API Routes** (`src/routes/moderation.js`)
- `/api/moderation/check` - Check content
- `/api/moderation/analyze` - Detailed analysis
- `/api/moderation/stats` - Dashboard statistics
- `/api/moderation/flagged` - Moderator review
- `/api/moderation/pattern` - Add custom patterns

### 3. **Documentation**
- `MODERATION_GUIDE.md` - Full usage guide
- `SERVER_INTEGRATION.js` - Integration examples
- `tests/moderation.test.js` - Working demo

## How It Works

```
User Input → Moderation Check → Decision → Response
                                  ↓
                        ┌─────────┼─────────┐
                        ↓         ↓         ↓
                    BLOCK      FLAG      ALLOW
                    (Severe)  (Medium)   (Safe)
                        ↓         ↓         ↓
                    Educate   Log & AI   Process
                    User      Response   Normally
```

## Example Responses

**Harmful Content (BLOCKED):**
```
Input:  "I'm thinking about killing myself"
Output: "I can't engage with that content. If you need help, 
         please contact a mental health professional or crisis service."
Action: BLOCK - No processing
```

**Flagged Content (ALLOWED but LOGGED):**
```
Input:  "You're so stupid"
Output: "That language can be hurtful. I encourage respectful 
         and constructive communication."
Action: FLAG - Logged for moderators, AI still responds
```

**Safe Content (ALLOWED):**
```
Input:  "Help me learn Python"
Output: "I'd be happy to help! What would you like to learn?"
Action: ALLOW - Normal processing
```

## Quick Integration (3 Steps)

### Step 1: Add Requires to server.js
```javascript
const ContentModerator = require('./src/services/moderation');
const moderationRoutes = require('./src/routes/moderation');
```

### Step 2: Initialize Moderator
```javascript
const moderator = new ContentModerator(path.join(__dirname, 'data'));
```

### Step 3: Add Routes
```javascript
app.use('/api/moderation', moderationRoutes(moderator));
```

### Step 4: Modify Your Chat Endpoint
```javascript
app.post('/api/chat', async (req, res) => {
    const { text, userId } = req.body;
    
    // Check for harmful content
    const moderation = moderator.processUserInput(text, userId);
    
    // Block if severe
    if (moderation.action === 'BLOCK') {
        return res.json({ response: moderation.response });
    }
    
    // Otherwise proceed normally
    const aiResponse = await yourAI.respond(text);
    res.json({ response: aiResponse });
});
```

## Current Patterns Detected

### 🔴 Critical (BLOCK)
- Self-harm: "kill yourself", "kys"

### 🟠 High (BLOCK)
- Hate speech: "I hate [group]"

### 🟡 Medium (FLAG)
- Harassment: "you suck", "you're stupid"

### 🟢 Low (FLAG)
- Profanity: "shit", "hell"

## Testing

Run the demo:
```bash
cd backend
node tests/moderation.test.js
```

Output shows:
- ✅ How each input is handled
- 📊 Flagged content statistics
- 🔧 Customization examples

## Add More Patterns

```javascript
// Add your own harmful pattern
moderator.addHarmfulPattern(
    'badword|another-word',
    'high',
    'harassment'
);
```

## Monitor Flagged Content

```bash
# View all flagged messages
curl http://localhost:3001/api/moderation/flagged

# Get statistics
curl http://localhost:3001/api/moderation/stats

# Filter by severity
curl "http://localhost:3001/api/moderation/flagged?severity=critical"
```

## Files Generated

After use, your system creates:

```
data/
├── flagged-content.json      ← All flagged messages
├── knowledge-base.json       ← (Optional) Training data
└── moderation-patterns.json  ← (Optional) Learned patterns
```

## Key Features

✅ **Educational** - Explains why language is inappropriate  
✅ **Safe** - Blocks critical content, educates users  
✅ **Smart** - Different responses for different severity levels  
✅ **Trackable** - Logs all flagged content for review  
✅ **Customizable** - Add your own patterns and thresholds  
✅ **Helpful** - Provides mental health resources when needed  

## Best Practices

1. **Review Flagged Content Regularly**
   ```bash
   curl http://localhost:3001/api/moderation/stats
   ```

2. **Add Organization-Specific Patterns**
   ```javascript
   moderator.addHarmfulPattern('company-specific-insult', 'medium', 'harassment');
   ```

3. **Adjust Severity Thresholds** Based on your community standards

4. **Monitor Trends** Use the stats endpoint to see patterns

5. **Update Patterns** As new harmful language emerges

## API Quick Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/moderation/check` | POST | Check if content is allowed |
| `/api/moderation/analyze` | POST | Get detailed analysis |
| `/api/moderation/stats` | GET | View moderation dashboard |
| `/api/moderation/flagged` | GET | See flagged content |
| `/api/moderation/pattern` | POST | Add custom pattern |

## Severity Levels

| Level | Action | Result |
|-------|--------|--------|
| Critical | BLOCK | Stop processing, offer help |
| High | BLOCK | Stop processing, educate |
| Medium | FLAG | Log but allow processing |
| Low | FLAG | Log but allow processing |

## Response Types

1. **Educational** - Why the language is inappropriate
2. **Decline** - "I can't respond to that"
3. **Help** - Mental health resources for critical cases
4. **Normal** - Proceed with AI response (for allowed content)

---

## ✨ Your AI is Now Safe, Smart, and Respectful!

Your system now:
- 🛡️ Protects users from harmful interactions
- 📚 Educates about respectful communication
- 📊 Tracks problematic content
- ❌ Blocks critical harm
- ✅ Allows positive interactions

Ready to deploy! 🚀
