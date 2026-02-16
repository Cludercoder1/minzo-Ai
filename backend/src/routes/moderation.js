/**
 * Moderation Routes
 * API endpoints for content moderation, filtering, and monitoring
 */

const express = require('express');
const router = express.Router();

module.exports = (moderator) => {
    /**
     * POST /api/moderation/check
     * Check content for harmful patterns
     * Body: { text: string, userId: string (optional) }
     */
    router.post('/check', (req, res) => {
        const { text, userId } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        const result = moderator.processUserInput(text, userId || 'unknown');

        res.json({
            success: true,
            isAllowed: result.isAllowed,
            action: result.action,
            response: result.response,
            analysis: {
                isHarmful: result.analysis.isHarmful,
                severity: result.analysis.severity,
                flags: result.analysis.flags
            }
        });
    });

    /**
     * POST /api/moderation/analyze
     * Detailed analysis of content
     * Body: { text: string }
     */
    router.post('/analyze', (req, res) => {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        const analysis = moderator.analyzeContent(text);

        res.json({
            success: true,
            text,
            analysis,
            recommendation: analysis.shouldBlock ? 'BLOCK' : (analysis.isHarmful ? 'FLAG' : 'ALLOW')
        });
    });

    /**
     * GET /api/moderation/stats
     * Get moderation statistics for dashboard
     */
    router.get('/stats', (req, res) => {
        const stats = moderator.getModerationStats();

        res.json({
            success: true,
            stats
        });
    });

    /**
     * GET /api/moderation/flagged
     * Get flagged content (for moderators)
     * Query params: ?severity=high&category=hate_speech&limit=20
     */
    router.get('/flagged', (req, res) => {
        const { severity, category, limit } = req.query;
        const filters = {};

        if (severity) filters.severity = severity;
        if (category) filters.category = category;
        if (limit) filters.limit = parseInt(limit);

        const flaggedContent = moderator.getFlaggedContent(filters);

        res.json({
            success: true,
            count: flaggedContent.length,
            content: flaggedContent
        });
    });

    /**
     * POST /api/moderation/pattern
     * Add custom harmful pattern (admin only)
     * Body: { pattern: string, severity: string, category: string }
     */
    router.post('/pattern', (req, res) => {
        const { pattern, severity, category } = req.body;

        if (!pattern || !severity || !category) {
            return res.status(400).json({ error: 'Pattern, severity, and category are required' });
        }

        try {
            moderator.addHarmfulPattern(pattern, severity, category);
            res.json({
                success: true,
                message: 'Pattern added successfully',
                pattern,
                severity,
                category
            });
        } catch (e) {
            res.status(400).json({ error: 'Invalid regex pattern' });
        }
    });

    /**
     * Extract topic from text using simple keyword matching
     * Can be enhanced with NLP libraries like natural or compromise
     */
    function extractTopic(text) {
        const topicKeywords = {
            'health': ['health', 'doctor', 'medicine', 'hospital', 'symptom', 'disease', 'treatment'],
            'technology': ['tech', 'software', 'hardware', 'code', 'programming', 'app', 'computer', 'ai', 'machine learning'],
            'romance': ['love', 'romantic', 'relationship', 'date', 'partner', 'crush', 'affection'],
            'education': ['learn', 'study', 'school', 'university', 'course', 'teach', 'education'],
            'business': ['business', 'company', 'startup', 'entrepreneurship', 'market', 'sales'],
            'sports': ['sport', 'game', 'team', 'player', 'coach', 'league', 'football', 'basketball'],
            'travel': ['travel', 'trip', 'vacation', 'hotel', 'flight', 'destination', 'tourism'],
            'food': ['food', 'recipe', 'cook', 'restaurant', 'eat', 'cuisine', 'meal']
        };
        
        const lowerText = text.toLowerCase();
        let maxScore = 0;
        let detectedTopic = 'General';
        
        for (const [topic, keywords] of Object.entries(topicKeywords)) {
            const score = keywords.filter(kw => lowerText.includes(kw)).length;
            if (score > maxScore) {
                maxScore = score;
                detectedTopic = topic.charAt(0).toUpperCase() + topic.slice(1);
            }
        }
        
        return detectedTopic;
    }

    /**
     * POST /api/chat
     * Modified chat endpoint with moderation
     * Integrates with your existing AI
     */
    router.post('/chat', (req, res) => {
        const { message, text, userId } = req.body;
        const userInput = message || text || '';

        // Extract topic from user input
        const topic = extractTopic(userInput);

        // First, check for harmful content
        const moderation = moderator.processUserInput(userInput, userId);

        // If content is blocked, return educational response only
        if (moderation.action === 'BLOCK') {
            return res.json({
                success: true,
                fromModerator: true,
                response: moderation.response,
                reason: 'Content violates community guidelines',
                severity: moderation.analysis.severity,
                topic: topic,
                type: 'text'
            });
        }

        // If content is flagged, log it but allow AI to respond
        if (moderation.action === 'FLAG') {
            return res.json({
                success: true,
                fromModerator: false,
                flagged: true,
                warning: moderation.response,
                response: "Your message was processed. How can I help?",
                topic: topic,
                type: 'text',
                confidence: 0.75
            });
        }

        // Otherwise, allow normal AI processing
        res.json({
            success: true,
            fromModerator: false,
            flagged: false,
            response: "I'm ready to help. What would you like to know?",
            topic: topic,
            type: 'text',
            confidence: 0.85
        });
    });

    return router;
};
