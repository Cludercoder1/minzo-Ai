/**
 * ROMANTIC CHAT INTEGRATION EXAMPLE
 * Add this to your backend/server.js to enable romantic responses
 */

// ============================================================================
// STEP 1: Add these requires at the top of server.js
// ============================================================================

const RomanticResponseEngine = require('./src/services/romanticEngine');
const ContentModerator = require('./src/services/moderation');

// ============================================================================
// STEP 2: Initialize both engines (after app = express())
// ============================================================================

const romanticEngine = new RomanticResponseEngine(knowledgeBase);
const moderator = new ContentModerator(path.join(__dirname, 'data'));

console.log('💕 Romantic Response Engine initialized');
console.log('🛡️  Content Moderation System initialized');

// ============================================================================
// STEP 3: Create a unified chat endpoint with romantic support
// ============================================================================

app.post('/api/chat', async (req, res) => {
    try {
        const { text, userId } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({ error: 'Text is required' });
        }

        const userInput = text.trim();
        const userIdSafe = userId || 'guest';

        // ========== FLOW 1: CONTENT MODERATION ==========
        // Check for harmful content FIRST (safety first)
        const moderation = moderator.processUserInput(userInput, userIdSafe);

        if (moderation.action === 'BLOCK') {
            // Critical content - block immediately
            return res.json({
                success: true,
                response: moderation.response,
                blocked: true,
                severity: moderation.analysis.severity,
                type: 'moderation'
            });
        }

        if (moderation.action === 'FLAG') {
            // Medium severity - log but continue
            console.log(`⚠️  FLAGGED from ${userIdSafe}: ${moderation.analysis.severity}`);
        }

        // ========== FLOW 2: ROMANTIC DETECTION ==========
        // Check if input is romantic in nature
        if (romanticEngine.isRomanticInput(userInput)) {
            const romanticResult = romanticEngine.processRomanticInput(userInput);

            if (romanticResult.success) {
                // Found romantic response!
                return res.json({
                    success: true,
                    response: romanticResult.response,
                    category: romanticResult.category,
                    matchScore: romanticResult.matchScore,
                    isRomantic: true,
                    type: 'romantic',
                    flagged: moderation.action === 'FLAG'
                });
            }
        }

        // ========== FLOW 3: REGULAR AI RESPONSE ==========
        // Fall back to regular AI for general queries
        try {
            const aiResponse = await yourAI.respond(userInput);

            return res.json({
                success: true,
                response: aiResponse,
                isRomantic: false,
                type: 'ai',
                flagged: moderation.action === 'FLAG'
            });
        } catch (aiError) {
            return res.json({
                success: true,
                response: "I'm having trouble thinking right now. Please try again!",
                error: true
            });
        }

    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({
            success: false,
            error: 'Unable to process your message'
        });
    }
});

// ============================================================================
// STEP 4 (OPTIONAL): Add romantic-specific endpoint
// ============================================================================

app.post('/api/romantic', (req, res) => {
    const { text, userId } = req.body;

    if (!text) {
        return res.status(400).json({ error: 'Text is required' });
    }

    const isRomantic = romanticEngine.isRomanticInput(text);

    if (!isRomantic) {
        return res.json({
            success: false,
            message: 'Input does not contain romantic keywords'
        });
    }

    const result = romanticEngine.processRomanticInput(text);

    res.json({
        success: result.success,
        input: text,
        response: result.response,
        category: result.category,
        matchScore: result.matchScore,
        isRomantic: true
    });
});

// ============================================================================
// STEP 5 (OPTIONAL): Get romantic statistics
// ============================================================================

app.get('/api/romantic/stats', (req, res) => {
    const stats = romanticEngine.getStatistics();
    res.json({
        success: true,
        stats
    });
});

// ============================================================================
// STEP 6 (OPTIONAL): Get random romantic response
// ============================================================================

app.get('/api/romantic/random/:category', (req, res) => {
    const { category } = req.params;
    const random = romanticEngine.getRandomResponseByCategory(category);

    if (!random) {
        return res.status(404).json({
            error: `Category "${category}" not found`
        });
    }

    res.json({
        success: true,
        category,
        response: random.response,
        isRandom: true
    });
});

// ============================================================================
// EXAMPLE CHAT INTERACTIONS
// ============================================================================

/*

Example 1: Romantic Input
--------------------------
REQUEST:
POST /api/chat
{
  "text": "Tumhari smile meri day ban jati hai",
  "userId": "user123"
}

RESPONSE:
{
  "success": true,
  "response": "Tumhara pyaar hi meri smile ka reason hai",
  "category": "compliments",
  "matchScore": 1.0,
  "isRomantic": true,
  "type": "romantic"
}

---

Example 2: Harmful Input
------------------------
REQUEST:
POST /api/chat
{
  "text": "kill yourself",
  "userId": "user123"
}

RESPONSE:
{
  "success": true,
  "response": "I can't engage with that content. If you need help, please contact a mental health professional or crisis service.",
  "blocked": true,
  "severity": "critical",
  "type": "moderation"
}

---

Example 3: Regular Query
------------------------
REQUEST:
POST /api/chat
{
  "text": "How do I learn Python?",
  "userId": "user123"
}

RESPONSE:
{
  "success": true,
  "response": "To learn Python, start with basics like variables, data types, and functions...",
  "isRomantic": false,
  "type": "ai"
}

---

Example 4: Romantic Stats
-------------------------
REQUEST:
GET /api/romantic/stats

RESPONSE:
{
  "success": true,
  "stats": {
    "totalRomanticResponses": 41,
    "categories": ["compliments", "flirting", "romantic_messages", ...],
    "byCategory": {
      "compliments": 3,
      "flirting": 8,
      "romantic_messages": 3,
      ...
    }
  }
}

---

Example 5: Random Romantic
--------------------------
REQUEST:
GET /api/romantic/random/flirting

RESPONSE:
{
  "success": true,
  "category": "flirting",
  "response": "Kya tum meri diary ho? Kyunki main tumhare baare mein har din sochta hoon",
  "isRandom": true
}

*/

// ============================================================================
// MIDDLEWARE (OPTIONAL): Auto-detect romantic messages
// ============================================================================

// Add this before your chat endpoint
app.use((req, res, next) => {
    if (req.body && req.body.text) {
        req.isRomantic = romanticEngine.isRomanticInput(req.body.text);
    }
    next();
});

// Then use in endpoint:
/*
app.post('/api/chat', (req, res) => {
    if (req.isRomantic) {
        // Handle romantic input
    } else {
        // Handle regular input
    }
});
*/

// ============================================================================
// MONITORING (OPTIONAL): Log romantic interactions
// ============================================================================

const romanticInteractions = [];

app.post('/api/chat', (req, res, next) => {
    // ... existing code ...

    // Log if romantic
    if (res.json && res.locals && res.locals.isRomantic) {
        romanticInteractions.push({
            timestamp: new Date().toISOString(),
            userId: userId || 'guest',
            input: userInput,
            category: res.locals.category
        });

        // Keep last 1000
        if (romanticInteractions.length > 1000) {
            romanticInteractions.shift();
        }
    }

    next();
});

// Get romantic interaction stats
app.get('/api/admin/romantic-interactions', (req, res) => {
    res.json({
        total: romanticInteractions.length,
        recent: romanticInteractions.slice(-20).reverse()
    });
});

// ============================================================================
// COMPLETE FLOW DIAGRAM
// ============================================================================

/*

User Message
    ↓
[Is content harmful?] ← Moderation Check
    ├─ YES → Block & educate
    └─ NO → Continue
        ↓
[Is content romantic?] ← Romantic Detection
    ├─ YES → [Match with database]
    │        ├─ Found → Return romantic response ✅
    │        └─ Not found → Continue
    └─ NO → Continue
        ↓
[Use regular AI] ← AI Processing
    ↓
Return response to user

*/

// ============================================================================
// TESTING THE INTEGRATION
// ============================================================================

/*

// Test romantic input
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"text":"Tumhari smile meri day ban jati hai"}'

// Test harmful input
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"text":"kill yourself"}'

// Test regular input
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"text":"How to learn JavaScript?"}'

// Get stats
curl http://localhost:3001/api/romantic/stats

// Get random flirty response
curl http://localhost:3001/api/romantic/random/flirting

*/
