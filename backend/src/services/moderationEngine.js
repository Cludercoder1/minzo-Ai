/**
 * Moderation Module Integration
 * Add this to your backend/server.js to enable content moderation
 * with trained patterns from the training script
 */

const fs = require('fs');
const path = require('path');

class ModerationEngine {
    constructor(dataDir) {
        this.dataDir = dataDir;
        this.patterns = this.loadPatterns();
        this.confidence = 0.7; // Detection confidence threshold
    }

    loadPatterns() {
        const patternFile = path.join(this.dataDir, 'moderation-patterns.json');
        try {
            if (fs.existsSync(patternFile)) {
                return JSON.parse(fs.readFileSync(patternFile, 'utf8'));
            }
        } catch (e) {
            console.warn('Moderation patterns not loaded:', e.message);
        }
        
        return {
            abusivePatterns: [],
            safePatterns: [],
            keywords: {},
            statistics: { totalTrained: 0, abusiveCount: 0, safeCount: 0 }
        };
    }

    /**
     * Check if content contains abusive language
     * @param {string} text - Content to check
     * @returns {object} { isAbusive: boolean, confidence: number, flags: [] }
     */
    detectAbusiveContent(text) {
        if (!text || typeof text !== 'string') {
            return { isAbusive: false, confidence: 0, flags: [] };
        }

        const lowerText = text.toLowerCase();
        const words = lowerText.split(/\W+/);
        const flags = [];
        let abuseScore = 0;

        // Check keywords
        words.forEach(word => {
            if (this.patterns.keywords[word]) {
                const kwData = this.patterns.keywords[word];
                const abusiveRatio = kwData.isAbusive / kwData.count;
                abuseScore += abusiveRatio;
                if (abusiveRatio > 0.7) {
                    flags.push({
                        word: word,
                        likelihood: abusiveRatio,
                        type: 'keyword'
                    });
                }
            }
        });

        // Check exact patterns
        let exactMatch = false;
        this.patterns.abusivePatterns.forEach(pattern => {
            if (lowerText.includes(pattern.text.toLowerCase())) {
                abuseScore += 2;
                exactMatch = true;
                flags.push({
                    match: pattern.text,
                    severity: pattern.severity,
                    type: 'exact_match'
                });
            }
        });

        const confidence = Math.min(abuseScore / 10, 1);
        const isAbusive = confidence >= this.confidence;

        return {
            isAbusive,
            confidence: parseFloat(confidence.toFixed(2)),
            flags,
            trained: this.patterns.statistics.totalTrained > 0
        };
    }

    /**
     * Get moderation statistics
     */
    getStatistics() {
        return {
            ...this.patterns.statistics,
            uniqueKeywords: Object.keys(this.patterns.keywords).length,
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * Update confidence threshold
     */
    setConfidenceThreshold(threshold) {
        if (threshold >= 0 && threshold <= 1) {
            this.confidence = threshold;
        }
    }
}

module.exports = ModerationEngine;
