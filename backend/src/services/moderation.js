/**
 * Moderation Module with Content Filtering
 * Detects, flags, and educates users about inappropriate content
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class ContentModerator {
    constructor(dataDir) {
        this.dataDir = dataDir;
        this.flaggedContent = [];
        this.confidenceThreshold = 0.6;
        
        // Built-in harmful patterns (expandable)
        this.harmfulPatterns = [
            // CRITICAL - Self Harm & Suicide
            { pattern: /kill.*yourself|kys|want.*to.*hurt|hurt\s+myself|self\s+harm|self\s+injure|suicide|end\s+it\s+all|want\s+to\s+die|cut\s+myself|slash\s+wrists/gi, severity: 'critical', category: 'self_harm' },
            
            // HIGH - Hate Speech & Violence
            { pattern: /hate\s+(speech|all|everyone|people)|should\s+die|deserve\s+to\s+die|kill\s+(them|people)|rape|murder|assault\s+(someone|him|her)/gi, severity: 'high', category: 'hate_speech' },
            
            // MEDIUM - Harassment & Bullying
            { pattern: /you\s+suck|you're\s+stupid|idiot|moron|dumbass|loser|worthless|pathetic|piece\s+of\s+shit|fat|ugly|disgusting/gi, severity: 'medium', category: 'harassment' },
            
            // LOW - Profanity
            { pattern: /fuck|shit|damn|crap|asshole|bitch/gi, severity: 'low', category: 'profanity' }
        ];
        
        this.loadFlaggedContent();
    }

    loadFlaggedContent() {
        const flagFile = path.join(this.dataDir, 'flagged-content.json');
        try {
            if (fs.existsSync(flagFile)) {
                this.flaggedContent = JSON.parse(fs.readFileSync(flagFile, 'utf8'));
            }
        } catch (e) {
            console.warn('Could not load flagged content log');
            this.flaggedContent = [];
        }
    }

    /**
     * Analyze content for harmful patterns
     */
    analyzeContent(text, userId = 'unknown') {
        if (!text || typeof text !== 'string') {
            return { isHarmful: false, flags: [], severity: 'none' };
        }

        const flags = [];
        let maxSeverity = 'none';
        const severityOrder = { none: 0, low: 1, medium: 2, high: 3, critical: 4 };

        this.harmfulPatterns.forEach(({ pattern, severity, category }) => {
            if (pattern.test(text)) {
                flags.push({
                    category,
                    severity,
                    matched: text.match(pattern)?.[0] || 'pattern matched'
                });

                if (severityOrder[severity] > severityOrder[maxSeverity]) {
                    maxSeverity = severity;
                }
            }
        });

        const isHarmful = flags.length > 0;

        // Log flagged content
        if (isHarmful) {
            this.logFlaggedContent({
                id: uuidv4(),
                timestamp: new Date().toISOString(),
                userId,
                text,
                flags,
                severity: maxSeverity
            });
        }

        return {
            isHarmful,
            flags,
            severity: maxSeverity,
            shouldBlock: maxSeverity === 'critical' || maxSeverity === 'high'
        };
    }

    /**
     * Generate educational response for inappropriate content
     */
    getEducationalResponse(flags, severity) {
        const educationMessages = {
            self_harm: "I'm concerned about what you've said. If you're having thoughts of self-harm, please reach out to a mental health professional or crisis helpline.",
            hate_speech: "Hate speech is harmful and goes against respectful communication. Let's keep our conversation inclusive and kind.",
            harassment: "That language can be hurtful. I encourage respectful and constructive communication.",
            profanity: "I'd appreciate if we could keep our conversation family-friendly and respectful."
        };

        if (severity === 'critical') {
            return "I can't engage with that content. If you need help, please contact a mental health professional or crisis service.";
        }

        if (flags.length > 0) {
            const category = flags[0].category;
            return educationMessages[category] || "I'd prefer if we could communicate respectfully.";
        }

        return "I can't respond to that language.";
    }

    /**
     * Get decline response (safe fallback)
     */
    getDeclineResponse() {
        const responses = [
            "I can't respond to that language. Could you rephrase in a respectful way?",
            "I'm designed to have helpful and respectful conversations. Let's try again with different language.",
            "I need to decline responding to that. Let's keep our chat constructive and kind."
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }

    /**
     * Process user input with full moderation
     */
    processUserInput(text, userId = 'unknown') {
        const analysis = this.analyzeContent(text, userId);

        return {
            originalText: text,
            isAllowed: !analysis.shouldBlock,
            analysis,
            response: analysis.shouldBlock 
                ? this.getEducationalResponse(analysis.flags, analysis.severity)
                : this.getDeclineResponse(),
            action: analysis.shouldBlock ? 'BLOCK' : (analysis.isHarmful ? 'FLAG' : 'ALLOW')
        };
    }

    /**
     * Log flagged content for moderator review
     */
    logFlaggedContent(entry) {
        this.flaggedContent.push(entry);
        this.saveFlaggedContent();
    }

    /**
     * Save flagged content to file
     */
    saveFlaggedContent() {
        const flagFile = path.join(this.dataDir, 'flagged-content.json');
        try {
            fs.writeFileSync(flagFile, JSON.stringify(this.flaggedContent, null, 2));
        } catch (e) {
            console.error('Error saving flagged content:', e.message);
        }
    }

    /**
     * Get moderator dashboard info
     */
    getModerationStats() {
        const criticalFlags = this.flaggedContent.filter(f => f.severity === 'critical').length;
        const highFlags = this.flaggedContent.filter(f => f.severity === 'high').length;
        const mediumFlags = this.flaggedContent.filter(f => f.severity === 'medium').length;

        return {
            totalFlagged: this.flaggedContent.length,
            critical: criticalFlags,
            high: highFlags,
            medium: mediumFlags,
            lastUpdated: new Date().toISOString(),
            recentFlags: this.flaggedContent.slice(-10).reverse()
        };
    }

    /**
     * Add custom harmful pattern
     */
    addHarmfulPattern(pattern, severity, category) {
        this.harmfulPatterns.push({
            pattern: new RegExp(pattern, 'gi'),
            severity,
            category
        });
    }

    /**
     * Get flagged content for moderators
     */
    getFlaggedContent(filters = {}) {
        let content = this.flaggedContent;

        if (filters.severity) {
            content = content.filter(f => f.severity === filters.severity);
        }

        if (filters.category) {
            content = content.filter(f => 
                f.flags.some(flag => flag.category === filters.category)
            );
        }

        if (filters.limit) {
            content = content.slice(-filters.limit);
        }

        return content.reverse();
    }
}

module.exports = ContentModerator;
