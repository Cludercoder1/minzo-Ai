/**
 * Romantic Response Engine
 * Enables your AI to respond with lovey-dovey messages
 * Uses fuzzy matching for similar inputs
 */

const fs = require('fs');
const path = require('path');

class RomanticResponseEngine {
    constructor(knowledgeBase) {
        this.knowledgeBase = knowledgeBase;
        this.romanticEntries = this.loadRomanticEntries();
        this.matchThreshold = 0.6; // 0-1 similarity threshold
    }

    /**
     * Load all romantic entries from knowledge base
     */
    loadRomanticEntries() {
        const romantic = [];
        Object.entries(this.knowledgeBase).forEach(([input, data]) => {
            if (data.categories && data.categories.includes('romantic')) {
                romantic.push({
                    input: input,
                    response: data.response,
                    category: data.categories[1] || 'general',
                    confidence: data.confidence || 0.9
                });
            }
        });
        return romantic;
    }

    /**
     * Simple string similarity (Levenshtein distance based)
     */
    stringSimilarity(s1, s2) {
        const longer = s1.length > s2.length ? s1 : s2;
        const shorter = s1.length > s2.length ? s2 : s1;

        if (longer.length === 0) return 1.0;

        const editDistance = this.levenshteinDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    }

    /**
     * Levenshtein distance for string comparison
     */
    levenshteinDistance(s1, s2) {
        const costs = [];

        for (let i = 0; i <= s1.length; i++) {
            let lastValue = i;
            for (let j = 0; j <= s2.length; j++) {
                if (i === 0) {
                    costs[j] = j;
                } else if (j > 0) {
                    let newValue = costs[j - 1];
                    if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
                        newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                    }
                    costs[j - 1] = lastValue;
                    lastValue = newValue;
                }
            }
            if (i > 0) costs[s2.length] = lastValue;
        }

        return costs[s2.length];
    }

    /**
     * Find romantic response for user input
     */
    findRomanticResponse(userInput) {
        if (!userInput) return null;

        const lowerInput = userInput.toLowerCase();
        let bestMatch = null;
        let bestScore = 0;

        // First try exact match
        for (const entry of this.romanticEntries) {
            if (entry.input.toLowerCase() === lowerInput) {
                return entry;
            }
        }

        // Then try similarity matching
        for (const entry of this.romanticEntries) {
            const similarity = this.stringSimilarity(
                lowerInput,
                entry.input.toLowerCase()
            );

            if (similarity > bestScore && similarity >= this.matchThreshold) {
                bestScore = similarity;
                bestMatch = {
                    ...entry,
                    matchScore: similarity
                };
            }
        }

        return bestMatch;
    }

    /**
     * Get random romantic response by category
     */
    getRandomResponseByCategory(category) {
        const matching = this.romanticEntries.filter(
            entry => entry.category === category
        );

        if (matching.length === 0) return null;

        const random = matching[Math.floor(Math.random() * matching.length)];
        return {
            response: random.response,
            category: random.category,
            isRandom: true
        };
    }

    /**
     * Get all categories
     */
    getCategories() {
        return [...new Set(this.romanticEntries.map(e => e.category))];
    }

    /**
     * Get statistics
     */
    getStatistics() {
        return {
            totalRomanticResponses: this.romanticEntries.length,
            categories: this.getCategories(),
            byCategory: this.romanticEntries.reduce((acc, entry) => {
                acc[entry.category] = (acc[entry.category] || 0) + 1;
                return acc;
            }, {})
        };
    }

    /**
     * Process user input and return romantic response
     */
    processRomanticInput(userInput) {
        const match = this.findRomanticResponse(userInput);

        if (match) {
            return {
                success: true,
                response: match.response,
                category: match.category,
                matchScore: match.matchScore || 1,
                source: 'romantic_dataset'
            };
        }

        return {
            success: false,
            response: null,
            source: 'none'
        };
    }

    /**
     * Check if input is romantic in nature
     */
    isRomanticInput(userInput) {
        const romanticKeywords = [
            'love', 'pyaar', 'miss', 'yaad', 'beautiful', 'handsome',
            'smile', 'laugh', 'hug', 'kiss', 'forever', 'soulmate',
            'proposal', 'marriage', 'wedding', 'anniversary', 'romantic',
            'coffee', 'date', 'heart', 'jaan', 'sweetheart'
        ];

        const lowerInput = userInput.toLowerCase();
        return romanticKeywords.some(keyword => lowerInput.includes(keyword));
    }
}

module.exports = RomanticResponseEngine;
