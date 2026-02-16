/**
 * SERVER INTEGRATION EXAMPLE
 * Add this code to your backend/server.js to enable content moderation
 * 
 * Location: Add this AFTER app initialization but BEFORE your routes
 */

// ============================================================================
// STEP 1: Add these requires at the top of server.js
// ============================================================================

const ContentModerator = require('./src/services/moderation');
const moderationRoutes = require('./src/routes/moderation');

// ============================================================================
// STEP 2: Initialize moderator (after app = express() line)
// ============================================================================

const moderator = new ContentModerator(path.join(__dirname, 'data'));
console.log('🛡️  Content Moderation System initialized');

// ============================================================================
// STEP 3: Add moderation routes (after other route definitions)
// ============================================================================

app.use('/api/moderation', moderationRoutes(moderator));

// ============================================================================
// STEP 4: Modify your chat endpoint to use moderation
// ============================================================================

// BEFORE (original):
/*
app.post('/api/chat', async (req, res) => {
    const { text, userId } = req.body;
    const aiResponse = await yourAI.process(text);
    res.json({ response: aiResponse });
});
*/

// AFTER (with moderation):
app.post('/api/chat', async (req, res) => {
    const { text, userId } = req.body;

    // ✅ First: Check for harmful content
    const moderation = moderator.processUserInput(text, userId);

    // 🔴 BLOCK: Critical/High severity - don't process
    if (moderation.action === 'BLOCK') {
        return res.json({
            success: true,
            response: moderation.response,
            blocked: true,
            reason: 'Content violates community guidelines',
            severity: moderation.analysis.severity
        });
    }

    // 🟡 FLAG: Medium severity - log but allow processing
    if (moderation.action === 'FLAG') {
        console.log(`⚠️  FLAGGED: "${text}" (${moderation.analysis.severity})`);
    }

    // ✅ ALLOW: Safe content - proceed normally
    try {
        const aiResponse = await yourAI.process(text);
        res.json({
            success: true,
            response: aiResponse,
            flagged: moderation.action === 'FLAG'
        });
    } catch (error) {
        res.status(500).json({ error: 'AI processing failed' });
    }
});

// ============================================================================
// STEP 5 (Optional): Add middleware for automatic moderation
// ============================================================================

// Middleware that checks ALL incoming text
app.use((req, res, next) => {
    if (req.body && req.body.text) {
        req.moderation = moderator.processUserInput(req.body.text, req.body.userId);
    }
    next();
});

// Then use it like:
/*
app.post('/api/chat', (req, res) => {
    if (!req.moderation.isAllowed) {
        return res.json({ response: req.moderation.response });
    }
    // ... continue with AI processing
});
*/

// ============================================================================
// STEP 6 (Optional): Add admin endpoint to manage patterns
// ============================================================================

app.post('/api/admin/moderation/pattern', (req, res) => {
    // Check authentication here!
    const { pattern, severity, category } = req.body;

    try {
        moderator.addHarmfulPattern(pattern, severity, category);
        res.json({ success: true, message: 'Pattern added' });
    } catch (e) {
        res.status(400).json({ error: 'Invalid pattern' });
    }
});

// ============================================================================
// STEP 7 (Optional): Monitor moderation in logs
// ============================================================================

// Add periodic logging of moderation stats
setInterval(() => {
    const stats = moderator.getModerationStats();
    if (stats.totalFlagged > 0) {
        console.log(`\n📊 Moderation Summary:`);
        console.log(`   Total Flagged: ${stats.totalFlagged}`);
        console.log(`   Critical: ${stats.critical} | High: ${stats.high} | Medium: ${stats.medium}`);
    }
}, 60000); // Every minute

// ============================================================================
// COMPLETE EXAMPLE: Integrated chat endpoint
// ============================================================================

/*
app.post('/api/chat', async (req, res) => {
    try {
        const { text, userId } = req.body;
        
        // Validate input
        if (!text || !text.trim()) {
            return res.status(400).json({ error: 'Text is required' });
        }

        // Check for harmful content FIRST
        const moderation = moderator.processUserInput(text.trim(), userId || 'guest');

        // Block critical/high severity
        if (moderation.action === 'BLOCK') {
            return res.json({
                success: true,
                response: moderation.response,
                blocked: true,
                severity: moderation.analysis.severity
            });
        }

        // Flag medium severity but continue
        if (moderation.action === 'FLAG') {
            console.log(`⚠️ FLAGGED from ${userId}: ${moderation.analysis.severity}`);
        }

        // Get AI response
        const aiResponse = await yourAI.respond(text);

        // Return successful response
        res.json({
            success: true,
            response: aiResponse,
            flagged: moderation.action === 'FLAG',
            userId: userId || 'guest'
        });

    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Unable to process request' 
        });
    }
});
*/

// ============================================================================
// TESTING
// ============================================================================

// Test endpoint - remove in production
app.get('/api/moderation/test', (req, res) => {
    const testText = req.query.text || 'Test message';
    const result = moderator.analyzeContent(testText);
    res.json({
        input: testText,
        analysis: result
    });
});

// ============================================================================
// API ENDPOINTS NOW AVAILABLE:
// ============================================================================

/*
POST /api/moderation/check
  - Check if content is allowed
  - Body: { text, userId }

POST /api/moderation/analyze
  - Get detailed analysis
  - Body: { text }

GET /api/moderation/stats
  - Get moderation statistics

GET /api/moderation/flagged
  - Get flagged content
  - Query: ?severity=high&limit=20

POST /api/moderation/pattern
  - Add custom pattern (admin)
  - Body: { pattern, severity, category }

POST /api/chat
  - Chat with moderation (modified)
  - Body: { text, userId }
*/
