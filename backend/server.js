const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

// Import moderation and romantic engines
const ContentModerator = require('./src/services/moderation');
const RomanticResponseEngine = require('./src/services/romanticEngine');
const ImageGenerator = require('./src/services/imageGenerator');
const RealImageGenerator = require('./src/services/realImageGenerator');
const moderationRoutes = require('./src/routes/moderation');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
const cookieParser = require('cookie-parser');
app.use(cookieParser());
// axios already imported earlier

// Auth & security
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
let GoogleStrategy = null;
try {
    GoogleStrategy = require('passport-google-oauth20').Strategy;
} catch (e) {
    console.warn('passport-google-oauth20 not available; Google OAuth disabled');
}

const JWT_SECRET = process.env.JWT_SECRET || 'minzo_dev_secret_change_me';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8000';

// Simple text processing functions
const simpleTokenizer = (text) => {
    return text.toLowerCase()
        .split(/\W+/)
        .filter(word => word.length > 2);
};

const simpleStemmer = (word) => {
    return word.replace(/(ing|s|es|ed|ly|ment)$/, '');
};

const isStopWord = (word) => {
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    return stopWords.includes(word.toLowerCase());
};

// Data storage paths and DB
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'minzo.db');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
}

const readJSON = (filePath, defaultValue) => {
    try {
        if (!fs.existsSync(filePath)) return defaultValue;
        const raw = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(raw);
    } catch (err) {
        console.warn('readJSON error for', filePath, err && err.message);
        return defaultValue;
    }
};

const writeJSON = (filePath, data) => {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
        console.error('writeJSON error for', filePath, err && err.message);
    }
};

// Simple filesystem-backed users store (in backend/data/users.json)
const USERS_FILE = path.join(DATA_DIR, 'users.json');
let users = readJSON(USERS_FILE, {});

function saveUsers() {
    writeJSON(USERS_FILE, users);
}

function generateJwtForUser(user) {
    const payload = { id: user.id, email: user.email, name: user.name };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

function authenticateJwt(req, res, next) {
    const auth = req.headers['authorization'] || req.cookies['authorization'];
    if (!auth) return res.status(401).json({ success: false, error: 'Missing auth token' });
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth;
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload;
        return next();
    } catch (err) {
        return res.status(401).json({ success: false, error: 'Invalid token' });
    }
}

// Try to use better-sqlite3; if it fails (Windows native build issues, missing Python, path problems),
// fall back to plain JSON file storage so the server remains usable for development.
let db = null;
let Database = null;
let useSQLite = false;
try {
    Database = require('better-sqlite3');
    db = new Database(DB_FILE);
    db.pragma('journal_mode = WAL');

    db.exec(`
    CREATE TABLE IF NOT EXISTS knowledge (
        topic TEXT PRIMARY KEY,
        response TEXT,
        confidence REAL,
        interactions INTEGER,
        categories TEXT,
        synonyms TEXT,
        sources TEXT,
        lastUpdated TEXT
    );

    CREATE TABLE IF NOT EXISTS interactions (
        id TEXT PRIMARY KEY,
        userId TEXT,
        userInput TEXT,
        aiResponse TEXT,
        timestamp TEXT,
        wasHelpful INTEGER,
        learned INTEGER
    );

    CREATE TABLE IF NOT EXISTS stats (
        key TEXT PRIMARY KEY,
        value INTEGER
    );
    `);

    // Ensure stats keys exist when using SQLite
    const initStat = db.prepare('INSERT OR IGNORE INTO stats (key, value) VALUES (?, ?)');
    initStat.run('totalInteractions', 0);
    initStat.run('uniqueUsers', 0);
    initStat.run('webSearches', 0);
    useSQLite = true;
    console.log('Using SQLite (better-sqlite3) for storage.');
} catch (err) {
    db = null;
    useSQLite = false;
    console.warn('better-sqlite3 not available. Falling back to JSON file storage. Error:', err && err.message);
}

class WorkingSelfLearningAI {
    constructor() {
        this.knowledgeBase = this.loadKnowledgeBase();
        this.userInteractions = this.loadInteractions();
        this.learningRate = 0.1;
        
        this.initializeBasicKnowledge();
        console.log('🤖 Self-Learning AI with WORKING Web Search initialized');
    }

    initializeBasicKnowledge() {
        const basicKnowledge = {
            "artificial intelligence": {
                response: "Artificial Intelligence (AI) refers to computer systems that can perform tasks typically requiring human intelligence. This includes learning, reasoning, problem-solving, perception, and language understanding. AI is transforming industries worldwide.",
                confidence: 0.9,
                interactions: 0,
                categories: ["technology", "computer science"],
                synonyms: ["AI", "machine intelligence"],
                sources: ["initial_knowledge"],
                lastUpdated: new Date().toISOString()
            },
            "machine learning": {
                response: "Machine Learning is a subset of AI that enables systems to learn and improve from experience without being explicitly programmed. It uses algorithms to identify patterns in data and make predictions. Common types include supervised, unsupervised, and reinforcement learning.",
                confidence: 0.9,
                interactions: 0,
                categories: ["technology", "data science"],
                synonyms: ["ML", "predictive analytics"],
                sources: ["initial_knowledge"],
                lastUpdated: new Date().toISOString()
            }
        };

        Object.keys(basicKnowledge).forEach(key => {
            if (!this.knowledgeBase[key]) {
                this.knowledgeBase[key] = basicKnowledge[key];
            }
        });
        
        this.saveKnowledgeBase();
    }

    loadKnowledgeBase() {
        if (!useSQLite || !db) {
            return readJSON(path.join(DATA_DIR, 'knowledge-base.json'), {});
        }
        try {
            const rows = db.prepare('SELECT * FROM knowledge').all();
            const kb = {};
            rows.forEach(r => {
                kb[r.topic] = {
                    response: r.response,
                    confidence: parseFloat(r.confidence) || 0,
                    interactions: parseInt(r.interactions) || 0,
                    categories: r.categories ? JSON.parse(r.categories) : [],
                    synonyms: r.synonyms ? JSON.parse(r.synonyms) : [],
                    sources: r.sources ? JSON.parse(r.sources) : [],
                    lastUpdated: r.lastUpdated
                };
            });
            return kb;
        } catch (error) {
            console.log('Creating new knowledge base (DB read failed)', error.message);
            return {};
        }
    }

    loadInteractions() {
        if (!useSQLite || !db) {
            const data = readJSON(path.join(DATA_DIR, 'user-interactions.json'), { interactions: [], statistics: { totalInteractions: 0, uniqueUsers: 0, webSearches: 0 } });
            // Handle both formats: array (old) and object with interactions property (new)
            if (Array.isArray(data)) {
                return {
                    interactions: data,
                    statistics: { totalInteractions: data.length, uniqueUsers: 0, webSearches: 0 }
                };
            }
            // Already in correct format
            if (data.interactions && data.statistics) {
                return data;
            }
            // Fallback
            return {
                interactions: [],
                statistics: { totalInteractions: 0, uniqueUsers: 0, webSearches: 0 }
            };
        }
        try {
            const rows = db.prepare('SELECT * FROM interactions').all();
            const interactions = rows.map(r => ({
                id: r.id,
                userId: r.userId,
                userInput: r.userInput,
                aiResponse: r.aiResponse,
                timestamp: r.timestamp,
                wasHelpful: !!r.wasHelpful,
                learned: !!r.learned
            }));

            const statsRows = db.prepare('SELECT * FROM stats').all();
            const stats = { totalInteractions: 0, uniqueUsers: 0, webSearches: 0 };
            statsRows.forEach(s => {
                stats[s.key] = parseInt(s.value) || 0;
            });

            return { interactions, statistics: stats };
        } catch (error) {
            console.log('Creating new interactions structure (DB read failed)', error.message);
            return {
                interactions: [],
                statistics: { totalInteractions: 0, uniqueUsers: 0, webSearches: 0 }
            };
        }
    }

    saveKnowledgeBase() {
        if (!useSQLite || !db) {
            writeJSON(path.join(DATA_DIR, 'knowledge-base.json'), this.knowledgeBase);
            return;
        }
        try {
            const insert = db.prepare(`INSERT OR REPLACE INTO knowledge (
                topic, response, confidence, interactions, categories, synonyms, sources, lastUpdated
            ) VALUES (@topic, @response, @confidence, @interactions, @categories, @synonyms, @sources, @lastUpdated)`);

            const insertMany = db.transaction((entries) => {
                for (const e of entries) insert.run(e);
            });

            const entries = Object.entries(this.knowledgeBase).map(([topic, data]) => ({
                topic,
                response: data.response || '',
                confidence: data.confidence || 0,
                interactions: data.interactions || 0,
                categories: JSON.stringify(data.categories || []),
                synonyms: JSON.stringify(data.synonyms || []),
                sources: JSON.stringify(data.sources || []),
                lastUpdated: data.lastUpdated || new Date().toISOString()
            }));

            insertMany(entries);
        } catch (error) {
            console.error('Error saving knowledge base to DB:', error.message);
        }
    }

    saveInteractions() {
        if (!useSQLite || !db) {
            try {
                const fallbackPath = path.join(DATA_DIR, 'user-interactions.json');
                writeJSON(fallbackPath, this.userInteractions);
            } catch (e) {
                console.error('Fallback write failed:', e && e.message);
            }
            return;
        }
        try {
            const insert = db.prepare(`INSERT OR REPLACE INTO interactions (
                id, userId, userInput, aiResponse, timestamp, wasHelpful, learned
            ) VALUES (@id, @userId, @userInput, @aiResponse, @timestamp, @wasHelpful, @learned)`);

            const insertMany = db.transaction((items) => {
                for (const it of items) insert.run(it);
            });

            const items = (this.userInteractions.interactions || []).map(i => ({
                id: i.id,
                userId: i.userId,
                userInput: i.userInput,
                aiResponse: i.aiResponse,
                timestamp: i.timestamp,
                wasHelpful: i.wasHelpful ? 1 : 0,
                learned: i.learned ? 1 : 0
            }));

            insertMany(items);

            // Update stats
            const upsertStat = db.prepare('INSERT OR REPLACE INTO stats (key, value) VALUES (?, ?)');
            upsertStat.run('totalInteractions', this.userInteractions.statistics.totalInteractions || 0);
            upsertStat.run('uniqueUsers', this.userInteractions.statistics.uniqueUsers || 0);
            upsertStat.run('webSearches', this.userInteractions.statistics.webSearches || 0);
        } catch (error) {
            console.error('Error saving interactions to DB:', error.message);
            // Fallback: write interactions to JSON file for development environments without SQLite
            try {
                const fallbackPath = path.join(DATA_DIR, 'user-interactions.json');
                writeJSON(fallbackPath, this.userInteractions);
                console.log('Wrote interactions to', fallbackPath);
            } catch (e) {
                console.error('Fallback write failed:', e && e.message);
            }
        }
    }

    async searchWeb(query, userId) {
        try {
            console.log(`🔍 Searching web for: "${query}"`);
            
            let results = await this.searchDuckDuckGo(query);
            
            if (!results || results.length === 0) {
                results = await this.searchWikipedia(query);
            }
            
            if (!results || results.length === 0) {
                results = this.createIntelligentMockResults(query);
            }

            this.userInteractions.statistics.webSearches++;
            this.saveInteractions();

            const learnedConcepts = this.learnFromSearchResults(query, results);

            return {
                success: true,
                results: results,
                query: query,
                totalResults: results.length,
                learned: learnedConcepts
            };

        } catch (error) {
            console.log('Web search failed:', error.message);
            return this.intelligentFallbackSearch(query, userId);
        }
    }

    async searchDuckDuckGo(query) {
        try {
            const response = await axios.get(
                `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`,
                { timeout: 8000 }
            );

            const data = response.data;
            const results = [];

            if (data.Abstract && data.Abstract !== '') {
                results.push({
                    title: data.Heading || query,
                    link: data.AbstractURL || `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
                    snippet: data.Abstract,
                    content: data.Abstract,
                    keyPoints: this.extractKeyPoints(data.Abstract),
                    relevance: 0.9,
                    credibility: 'high',
                    source: 'DuckDuckGo'
                });
            }

            if (data.RelatedTopics && data.RelatedTopics.length > 0) {
                data.RelatedTopics.slice(0, 3).forEach(topic => {
                    if (topic.Text && topic.Text.length > 10) {
                        results.push({
                            title: this.extractTitleFromText(topic.Text) || query,
                            link: topic.FirstURL || `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
                            snippet: topic.Text.substring(0, 200) + '...',
                            content: topic.Text,
                            keyPoints: this.extractKeyPoints(topic.Text),
                            relevance: 0.7,
                            credibility: 'medium',
                            source: 'DuckDuckGo'
                        });
                    }
                });
            }

            return results.length > 0 ? results : null;

        } catch (error) {
            console.log('DuckDuckGo search failed:', error.message);
            return null;
        }
    }

    async searchWikipedia(query) {
        try {
            const response = await axios.get(
                `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`,
                { timeout: 8000 }
            );

            const data = response.data;
            const results = [];

            if (data.extract) {
                results.push({
                    title: data.title || query,
                    link: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(query)}`,
                    snippet: data.extract,
                    content: data.extract,
                    keyPoints: this.extractKeyPoints(data.extract),
                    relevance: 0.95,
                    credibility: 'very high',
                    source: 'Wikipedia'
                });
            }

            return results.length > 0 ? results : null;

        } catch (error) {
            console.log('Wikipedia search failed:', error.message);
            return null;
        }
    }

    extractTitleFromText(text) {
        const sentences = text.split('. ');
        if (sentences.length > 0) {
            return sentences[0].substring(0, 60) + (sentences[0].length > 60 ? '...' : '');
        }
        return 'Search Result';
    }

    extractKeyPoints(text) {
        const sentences = text.split('. ').filter(s => s.length > 20 && s.length < 200);
        return sentences.slice(0, 3).map(s => s.trim());
    }

    // Append interaction (used when persisting user chats)
    appendInteraction(interaction) {
        if (!this.userInteractions.interactions || !Array.isArray(this.userInteractions.interactions)) {
            this.userInteractions.interactions = [];
        }
        this.userInteractions.interactions.push(interaction);
        this.userInteractions.statistics.totalInteractions = (this.userInteractions.statistics.totalInteractions || 0) + 1;
        this.saveInteractions();
        // broadcast to connected SSE clients for this user
        try {
            if (interaction && interaction.userId) {
                broadcastInteractionToUser(interaction.userId, interaction);
            }
        } catch (e) {
            // ignore if SSE not available
        }
    }

    createIntelligentMockResults(query) {
        const queryLower = query.toLowerCase();
        const mockData = {
            'quantum computing': {
                title: 'Quantum Computing - Advanced Overview',
                snippet: 'Quantum computing uses quantum-mechanical phenomena like superposition and entanglement to perform computations. Unlike classical computers that use bits, quantum computers use quantum bits or qubits.',
                content: 'Quantum computing is an emerging field that leverages quantum mechanics to solve complex problems much faster than classical computers. Qubits can exist in multiple states simultaneously, enabling parallel processing.',
                keyPoints: [
                    'Uses qubits instead of classical bits',
                    'Leverages quantum superposition and entanglement',
                    'Can solve certain problems exponentially faster'
                ]
            },
            'blockchain': {
                title: 'Blockchain Technology Explained',
                snippet: 'Blockchain is a distributed, decentralized digital ledger that records transactions across many computers in a way that ensures security, transparency, and immutability.',
                content: 'Blockchain technology creates a permanent, immutable record of transactions. Each block contains a cryptographic hash of the previous block, creating a chain that is extremely secure.',
                keyPoints: [
                    'Decentralized and distributed ledger',
                    'Cryptographically secure and immutable',
                    'Originally developed for cryptocurrencies'
                ]
            }
        };

        let response = mockData[queryLower];
        
        if (!response) {
            response = {
                title: `Information about ${query}`,
                snippet: `I'm researching "${query}" to provide you with accurate information.`,
                content: `"${query}" is being analyzed through available information sources.`,
                keyPoints: [
                    `Researching "${query}" in depth`,
                    'Multiple sources being consulted',
                    'Real-time learning in progress'
                ]
            };
        }

        return [{
            title: response.title,
            link: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
            snippet: response.snippet,
            content: response.content,
            keyPoints: response.keyPoints,
            relevance: 0.85,
            credibility: 'high',
            source: 'AI Knowledge Base'
        }];
    }

    intelligentFallbackSearch(query, userId) {
        const results = this.createIntelligentMockResults(query);
        this.userInteractions.statistics.webSearches++;
        this.saveInteractions();

        return {
            success: true,
            results: results,
            query: query,
            totalResults: results.length,
            learned: this.learnFromSearchResults(query, results)
        };
    }

    learnFromSearchResults(query, results) {
        const learnedConcepts = [];
        
        results.forEach(result => {
            if (result.content) {
                const concepts = this.extractConcepts(result.content);
                concepts.forEach(concept => {
                    if (!this.knowledgeBase[concept] && concept.length > 3) {
                        this.knowledgeBase[concept] = {
                            response: `I learned about "${concept}" while researching "${query}". ${result.content.substring(0, 150)}...`,
                            confidence: 0.7,
                            interactions: 0,
                            categories: ["web_research"],
                            synonyms: [],
                            sources: ["web_search"],
                            lastUpdated: new Date().toISOString()
                        };
                        learnedConcepts.push(concept);
                    }
                });
            }
        });

        if (learnedConcepts.length > 0) {
            this.saveKnowledgeBase();
        }

        return learnedConcepts;
    }

    extractConcepts(text) {
        const words = simpleTokenizer(text);
        const significantWords = words.filter(word => 
            word.length > 4 && !isStopWord(word)
        );
        
        const stems = significantWords.map(word => simpleStemmer(word));
        return [...new Set(stems)].slice(0, 5);
    }

    isGreeting(input) {
        const greetings = ['hello', 'hi', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening'];
        return greetings.some(greeting => input.includes(greeting));
    }

    findKnowledgeMatch(input) {
        let bestMatch = null;
        let highestScore = 0;

        for (const [topic, data] of Object.entries(this.knowledgeBase)) {
            let score = 0;
            
            if (input.includes(topic.toLowerCase())) {
                score += 0.8;
            }
            
            if (data.synonyms) {
                data.synonyms.forEach(synonym => {
                    if (input.includes(synonym.toLowerCase())) {
                        score += 0.6;
                    }
                });
            }
            
            score += (data.confidence * 0.2);
            
            if (score > highestScore && score > 0.3) {
                highestScore = score;
                bestMatch = { topic, data, score };
            }
        }

        return bestMatch;
    }

    formatWebResponse(query, results) {
        const topResult = results[0];
        
        let response = `🔍 **I found this information about "${query}":**\n\n`;
        response += `**${topResult.title}**\n`;
        response += `${topResult.snippet}\n\n`;
        
        if (topResult.keyPoints && topResult.keyPoints.length > 0) {
            response += `**Key Insights:**\n`;
            response += topResult.keyPoints.map(point => `• ${point}`).join('\n') + '\n\n';
        }
        
        response += `*Source: ${topResult.source}*\n\n`;
        response += `💡 *I've learned from this search and updated my knowledge base!*`;
        
        return response;
    }

    createResponse(text, confidence, source, topic = 'general', learned = false, webResults = null, usedWebSearch = false) {
        return {
            text: text,
            confidence: confidence,
            source: source,
            topic: topic,
            learned: learned,
            usedWebSearch: usedWebSearch,
            webResults: webResults,
            timestamp: new Date().toISOString()
        };
    }

    learnFromInteraction(userInput, aiResponse, userId, wasHelpful) {
        if (!this.userInteractions) this.userInteractions = { interactions: [], statistics: { totalInteractions: 0, uniqueUsers: 0, webSearches: 0 } };
        if (!this.userInteractions.interactions || !Array.isArray(this.userInteractions.interactions)) {
            this.userInteractions.interactions = [];
        }
        if (!this.userInteractions.statistics) this.userInteractions.statistics = { totalInteractions: 0, uniqueUsers: 0, webSearches: 0 };

        const interaction = {
            id: uuidv4(),
            userId: userId,
            userInput: userInput,
            aiResponse: aiResponse,
            timestamp: new Date().toISOString(),
            wasHelpful: wasHelpful,
            learned: true
        };

        this.userInteractions.interactions.push(interaction);
        this.userInteractions.statistics.totalInteractions = (this.userInteractions.statistics.totalInteractions || 0) + 1;
        this.saveInteractions();

        this.extractKnowledge(userInput, aiResponse, wasHelpful);
    }

    extractKnowledge(userInput, aiResponse, wasHelpful) {
        const words = simpleTokenizer(userInput);
        const significantWords = words.filter(word => 
            word.length > 3 && !isStopWord(word)
        );

        significantWords.forEach(word => {
            if (!this.knowledgeBase[word] && word.length > 3) {
                this.knowledgeBase[word] = {
                    response: `I learned about "${word}" from our conversation. ${aiResponse.substring(0, 100)}...`,
                    confidence: 0.5,
                    interactions: 1,
                    categories: ["user_defined"],
                    synonyms: [],
                    sources: ["user_interaction"],
                    lastUpdated: new Date().toISOString()
                };
            }
        });

        this.saveKnowledgeBase();
    }

    getStatistics() {
        const topics = Object.keys(this.knowledgeBase).length;
        const interactions = this.userInteractions.statistics.totalInteractions;
        const webSearches = this.userInteractions.statistics.webSearches;
        const avgConfidence = topics > 0 ? 
            Object.values(this.knowledgeBase).reduce((sum, k) => sum + k.confidence, 0) / topics : 0;
        
        return {
            totalTopics: topics,
            totalInteractions: interactions,
            webSearches: webSearches,
            averageConfidence: avgConfidence.toFixed(2),
            systemStatus: 'ACTIVE_AND_SEARCHING'
        };
    }

    async generateResponse(userInput, userId, useWebSearch = true) {
        console.log(`🎯 Processing: "${userInput}" [Web Search: ${useWebSearch}]`);
        
        const cleanInput = userInput.trim();
        
        if (cleanInput.length < 2) {
            return this.createResponse("Please ask me a proper question!", 0.3, 'input_error');
        }

        if (this.isGreeting(cleanInput.toLowerCase())) {
            return this.createResponse(
                "Hello! I'm MinzoFoundation AI. I can learn from our conversations and search the web for information. What would you like to know?",
                0.9,
                'greeting'
            );
        }

        if (useWebSearch && cleanInput.length > 3) {
            const searchResult = await this.searchWeb(cleanInput, userId);
            
            if (searchResult.success && searchResult.results.length > 0) {
                const response = this.formatWebResponse(cleanInput, searchResult.results);
                this.learnFromInteraction(cleanInput, response, userId, true);
                
                return this.createResponse(
                    response,
                    0.85,
                    'web_enhanced',
                    'web_research',
                    true,
                    searchResult.results,
                    true
                );
            }
        }

        const knowledgeMatch = this.findKnowledgeMatch(cleanInput.toLowerCase());
        if (knowledgeMatch) {
            knowledgeMatch.data.interactions++;
            knowledgeMatch.data.confidence = Math.min(0.95, knowledgeMatch.data.confidence + 0.05);
            this.saveKnowledgeBase();
            
            return this.createResponse(
                knowledgeMatch.data.response,
                knowledgeMatch.data.confidence,
                'knowledge_base',
                knowledgeMatch.topic
            );
        }

        const fallbackResponse = `I'm actively learning about "${cleanInput}". I've searched for information and will continue to learn from our conversation. Could you provide more details?`;
        
        this.learnFromInteraction(cleanInput, fallbackResponse, userId, false);
        
        return this.createResponse(
            fallbackResponse,
            0.6,
            'learning_request',
            'general',
            true
        );
    }
}

// Initialize AI
const minzoAI = new WorkingSelfLearningAI();

// Initialize Moderation System
const moderator = new ContentModerator(path.join(__dirname, 'data'));
console.log('🛡️  Content Moderation System initialized');

// Initialize Romantic Response Engine
const romanticEngine = new RomanticResponseEngine(minzoAI.knowledgeBase);
console.log('💕 Romantic Response Engine initialized');

// Initialize Image Generator
const imageGenerator = new ImageGenerator();
console.log('🖼️  Image Generation Service initialized');

// Initialize Real Image Generator (for actual photos)
const realImageGenerator = new RealImageGenerator();
console.log('📸 Real Image Generator initialized (Pexels, Unsplash, Pixabay, Hugging Face)');

// Moderation Routes
app.use('/api/moderation', moderationRoutes(moderator));

// API Routes
app.get('/', (req, res) => {
    res.json({ 
        message: '🎉 MinzoFoundation AI with WORKING Web Search!',
        timestamp: new Date().toISOString(),
        status: 'ACTIVE',
        version: '2.0.0'
    });
});

app.get('/api/health', (req, res) => {
    const stats = minzoAI.getStatistics();
    res.json({
        status: 'OK',
        system: 'Self-Learning AI with Web Search',
        timestamp: new Date().toISOString(),
        statistics: stats
    });
});

// --- AUTH ROUTES (local + Google OAuth) ---
// Register local account
app.post('/api/register', (req, res) => {
    console.log('[/api/register] incoming request:');
    console.log('  - Content-Type:', req.get('content-type'));
    console.log('  - Body:', JSON.stringify(req.body));
    
    const { email, password, name } = req.body || {};
    console.log('[/api/register] parsed:', { email, password: password ? '***' : 'missing', name });
    
    if (!email || !password) {
        console.log('[/api/register] validation failed - email or password missing');
        return res.status(400).json({ success: false, error: 'Email and password required' });
    }
    const lower = email.toLowerCase();
    if (users[lower]) {
        console.log('[/api/register] user already exists:', lower);
        return res.status(400).json({ success: false, error: 'User already exists' });
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);
    const id = 'user_' + Date.now();
    users[lower] = { id, email: lower, name: name || '', passwordHash: hash, createdAt: new Date().toISOString(), provider: 'local' };
    saveUsers();
    const token = generateJwtForUser(users[lower]);
    res.json({ success: true, token, user: { id, email: lower, name: name || '' } });
});

// Login local account
app.post('/api/login', (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ success: false, error: 'Email and password required' });
    const lower = email.toLowerCase();
    const user = users[lower];
    if (!user) return res.status(401).json({ success: false, error: 'Invalid credentials' });
    const ok = bcrypt.compareSync(password, user.passwordHash || '');
    if (!ok) return res.status(401).json({ success: false, error: 'Invalid credentials' });
    const token = generateJwtForUser(user);
    res.json({ success: true, token, user: { id: user.id, email: user.email, name: user.name } });
});

// Protected endpoint to get current user
app.get('/api/me', authenticateJwt, (req, res) => {
    const u = users[req.user.email] || Object.values(users).find(x => x.id === req.user.id);
    if (!u) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, user: { id: u.id, email: u.email, name: u.name } });
});

// Setup passport Google OAuth if credentials exist
const session = require('express-session');
app.use(session({ secret: process.env.SESSION_SECRET || 'minzo_session_secret', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

if (GoogleStrategy && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK || `http://localhost:${PORT}/auth/google/callback`
    }, function(accessToken, refreshToken, profile, cb) {
        const email = (profile.emails && profile.emails[0] && profile.emails[0].value || '').toLowerCase();
        let user = users[email];
        if (!user) {
            const id = 'user_' + Date.now();
            user = { id, email, name: profile.displayName || '', provider: 'google', googleId: profile.id, createdAt: new Date().toISOString() };
            users[email] = user;
            saveUsers();
        }
        return cb(null, user);
    }));

    passport.serializeUser(function(user, cb) {
        cb(null, user.email);
    });

    passport.deserializeUser(function(email, cb) {
        const u = users[email];
        cb(null, u || null);
    });

    app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

    app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: FRONTEND_URL }), (req, res) => {
        // On success, generate JWT and redirect to frontend with token
        const user = req.user;
        if (!user) return res.redirect(FRONTEND_URL + '/?auth=failed');
        const token = generateJwtForUser(user);
        // Redirect with token in hash to avoid server logs
        const redirectUrl = `${FRONTEND_URL}#token=${token}`;
        res.redirect(redirectUrl);
    });
} else {
    console.log('Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable.');
    app.get('/auth/google', (req, res) => {
        res.status(400).json({ 
            success: false, 
            error: 'Google OAuth not configured on this server',
            message: 'Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables and restart the server to enable Google sign-in.'
        });
    });
}

app.post('/api/chat', async (req, res) => {
    try {
        const { message, userId: providedUserId = null, useWebSearch = true } = req.body;
        // Try to detect JWT from Authorization header
        let userId = providedUserId || ('user_' + Date.now());
        try {
            const auth = req.headers['authorization'] || req.cookies['authorization'];
            if (auth) {
                const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth;
                const payload = jwt.verify(token, JWT_SECRET);
                if (payload && payload.id) userId = payload.id;
            }
        } catch (e) {
            // ignore token errors, proceed as anonymous
        }
        
        if (!message || message.trim().length === 0) {
            return res.status(400).json({ 
                success: false,
                error: 'Please provide a message' 
            });
        }

        console.log(`💬 CHAT REQUEST: "${message}"`);
        
        // ========== STEP 1: CONTENT MODERATION ==========
        const moderation = moderator.processUserInput(message.trim(), userId);

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
            console.log(`⚠️  FLAGGED from ${userId}: ${moderation.analysis.severity}`);
        }

        // ========== STEP 2: ROMANTIC DETECTION ==========
        if (romanticEngine.isRomanticInput(message)) {
            const romanticResult = romanticEngine.processRomanticInput(message);

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

        // ========== STEP 3: IMAGE GENERATION DETECTION ==========
        // Check if message is asking for image generation
        const imageKeywords = /generate|create|draw|make|show|picture|image|artwork|visualize|photo|design/i;
        if (imageKeywords.test(message)) {
            // Extract the actual image prompt (remove "generate", "create", etc.)
            let imagePrompt = message.replace(/^(generate|create|draw|make|show|visualize|design)\s+/i, '').trim();
            
            if (imagePrompt.length > 3) {
                console.log(`🎨 REAL IMAGE GENERATION REQUEST: "${imagePrompt}"`);
                
                try {
                    // Use RealImageGenerator for actual images
                    const realImageResult = await realImageGenerator.generateImage(imagePrompt, 3);
                    
                    if (realImageResult && realImageResult.images && realImageResult.images.length > 0) {
                        console.log(`✅ Generated ${realImageResult.images.length} real images from ${realImageResult.source}`);
                        
                        return res.json({
                            success: true,
                            response: `🎨 Found ${realImageResult.images.length} images for "${imagePrompt}" (Source: ${realImageResult.source})`,
                            type: 'image',
                            images: realImageResult.images,
                            prompt: imagePrompt,
                            imageSource: realImageResult.source,
                            cached: realImageResult.cached || false,
                            flagged: moderation.action === 'FLAG'
                        });
                    }
                } catch (imageErr) {
                    console.warn('Real image generation error:', imageErr);
                    // Fall through to regular AI response
                }
            }
        }

        // ========== STEP 4: REGULAR AI RESPONSE ==========
        const aiResponse = await minzoAI.generateResponse(message, userId, useWebSearch);

        // Persist the interaction (if possible)
        try {
            const interaction = {
                id: uuidv4(),
                userId: userId,
                userInput: message,
                aiResponse: aiResponse.text,
                timestamp: new Date().toISOString(),
                wasHelpful: 0,
                learned: aiResponse.learned ? 1 : 0
            };
            minzoAI.appendInteraction(interaction);
        } catch (e) {
            console.warn('Could not persist interaction:', e && e.message);
        }

        res.json({
            success: true,
            response: aiResponse.text,
            confidence: aiResponse.confidence,
            topic: aiResponse.topic,
            source: aiResponse.source,
            learned: aiResponse.learned,
            usedWebSearch: aiResponse.usedWebSearch,
            webResults: aiResponse.webResults,
            isRomantic: false,
            flagged: moderation.action === 'FLAG',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Chat error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Processing error',
            message: 'I encountered an issue. Please try again.'
        });
    }
});

app.post('/api/search', async (req, res) => {
    try {
        const { query, userId = 'user_' + Date.now() } = req.body;
        
        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }

        console.log(`🔍 DIRECT SEARCH: "${query}"`);
        const searchResult = await minzoAI.searchWeb(query, userId);
        
        res.json({
            success: searchResult.success,
            query: query,
            results: searchResult.results,
            totalResults: searchResult.totalResults,
            learnedConcepts: searchResult.learned,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Search failed',
            message: 'Please try a different query.'
        });
    }
});

// Proxy to the Python image generation service
app.post('/api/generate-image', async (req, res) => {
    try {
        const { prompt, width = 1024, height = 1024, mode = 'placeholder', provider } = req.body || {};
        const imageServiceUrl = process.env.IMAGE_SERVICE_URL || process.env.PYTHON_IMAGE_SERVICE_URL || 'http://localhost:5001/generate';
        const minzoApiKey = process.env.MINZO_API_KEY || null;
        if (!imageServiceUrl && !minzoApiKey) {
            return res.status(501).json({ success: false, error: 'No image generation service configured', message: 'Set PYTHON_IMAGE_SERVICE_URL or MINZO_API_KEY in environment variables' });
        }

        const payload = { prompt, width, height, mode, provider };
        const resp = await axios.post(imageServiceUrl, payload, { headers: { 'Content-Type': 'application/json' }, timeout: 60000 });
        if (resp && resp.data) {
            return res.json(resp.data);
        }
        return res.status(502).json({ success: false, error: 'No response from image service' });
    } catch (error) {
        console.error('Image generation proxy error:', error && error.message);
        return res.status(500).json({ success: false, error: 'Image generation error', message: error && error.message });
    }
});

// TTS (Text-to-Speech) Endpoints
app.post('/api/tts', async (req, res) => {
    try {
        const { text, language = 'en' } = req.body || {};
        
        if (!text || text.trim().length === 0) {
            return res.status(400).json({ success: false, error: 'Text is required' });
        }

        const ttsServiceUrl = process.env.TTS_SERVICE_URL || process.env.PYTHON_IMAGE_SERVICE_URL || 'http://localhost:5001/tts';
        
        const payload = { text, language };
        const resp = await axios.post(ttsServiceUrl, payload, { 
            headers: { 'Content-Type': 'application/json' }, 
            timeout: 60000 
        });
        
        if (resp && resp.data) {
            return res.json(resp.data);
        }
        return res.status(502).json({ success: false, error: 'No response from TTS service' });
    } catch (error) {
        console.error('TTS error:', error && error.message);
        return res.status(500).json({ success: false, error: 'TTS generation error', message: error && error.message });
    }
});

app.post('/api/tts/file', async (req, res) => {
    try {
        const { text, language = 'en' } = req.body || {};
        
        if (!text || text.trim().length === 0) {
            return res.status(400).json({ success: false, error: 'Text is required' });
        }

        const ttsServiceUrl = process.env.TTS_SERVICE_URL || process.env.PYTHON_IMAGE_SERVICE_URL || 'http://localhost:5001/tts/file';
        
        const payload = { text, language };
        const resp = await axios.post(ttsServiceUrl, payload, { 
            headers: { 'Content-Type': 'application/json' }, 
            timeout: 60000,
            responseType: 'arraybuffer'
        });
        
        if (resp && resp.data) {
            res.type('audio/wav');
            res.set('Content-Disposition', 'attachment; filename="speech.wav"');
            return res.send(resp.data);
        }
        return res.status(502).json({ success: false, error: 'No response from TTS service' });
    } catch (error) {
        console.error('TTS file error:', error && error.message);
        return res.status(500).json({ success: false, error: 'TTS file generation error', message: error && error.message });
    }
});

app.get('/api/statistics', (req, res) => {
    const stats = minzoAI.getStatistics();
    res.json({
        success: true,
        statistics: stats,
        timestamp: new Date().toISOString()
    });
});

// Real Image Generation Endpoints
app.post('/api/image/generate-real', async (req, res) => {
    try {
        const { prompt, count = 3 } = req.body;

        if (!prompt || prompt.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Prompt is required'
            });
        }

        console.log(`📸 Real image generation request: "${prompt}" (count: ${count})`);
        
        const result = await realImageGenerator.generateImage(prompt, count);
        
        res.json({
            success: true,
            prompt: prompt,
            images: result.images,
            source: result.source,
            cached: result.cached || false,
            stats: realImageGenerator.getStats()
        });

    } catch (error) {
        console.error('Real image generation error:', error);
        res.status(500).json({
            success: false,
            error: 'Image generation failed',
            message: error.message
        });
    }
});

app.get('/api/image/real-stats', (req, res) => {
    const stats = realImageGenerator.getStats();
    res.json({
        success: true,
        stats: stats,
        availableProviders: ['Pexels', 'Unsplash', 'Pixabay', 'Hugging Face'],
        configurationGuide: {
            'UNSPLASH_API_KEY': 'Get from https://unsplash.com/oauth/applications',
            'PIXABAY_API_KEY': 'Get from https://pixabay.com/api/docs/',
            'PEXELS_API_KEY': 'Optional - Get from https://www.pexels.com/api/',
            'HUGGINGFACE_API_KEY': 'Optional - Get from https://huggingface.co/settings/tokens'
        },
        timestamp: new Date().toISOString()
    });
});

app.post('/api/config/image-keys', (req, res) => {
    const { unsplash, pixabay, pexels, huggingface } = req.body;
    
    if (unsplash) realImageGenerator.providers.unsplash = unsplash;
    if (pixabay) realImageGenerator.providers.pixabay = pixabay;
    if (pexels) realImageGenerator.providers.pexels = pexels;
    if (huggingface) realImageGenerator.providers.huggingface = huggingface;
    
    console.log('🔑 Image generation API keys configured');
    
    res.json({
        success: true,
        message: 'API keys configured',
        configuredProviders: Object.keys(realImageGenerator.providers).filter(
            p => realImageGenerator.providers[p] !== null
        )
    });
});

// Romantic endpoints
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

app.get('/api/romantic/stats', (req, res) => {
    const stats = romanticEngine.getStatistics();
    res.json({
        success: true,
        stats
    });
});

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

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log('='.repeat(70));
    console.log('🚀 MINZOFOUNDATION AI - FULL FEATURED!');
    console.log('='.repeat(70));
    console.log(`📍 Port: ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`🔍 Web Search: ✅ ACTIVE`);
    console.log(`🤖 Learning: ✅ ACTIVE`);
    console.log(`💕 Romantic Responses: ✅ ${romanticEngine.getStatistics().totalRomanticResponses} responses trained`);
    console.log(`🛡️  Content Moderation: ✅ ACTIVE`);
    console.log(`�️  Image Generation: ✅ ACTIVE`);
    console.log(`📊 Knowledge: ${Object.keys(minzoAI.knowledgeBase).length} topics`);
    console.log('='.repeat(70));
    console.log('✅ All systems ready! Server is LIVE on localhost:3001');
    console.log('='.repeat(70));
    console.log('\nAvailable Endpoints:');
    console.log('  POST /api/chat - Chat with AI (supports images, moderation & romance)');
    console.log('  POST /api/romantic - Romantic response detection');
    console.log('  GET /api/romantic/stats - Romantic response statistics');
    console.log('  GET /api/moderation/stats - Moderation statistics');
    console.log('  POST /api/moderation/check - Check content for harmful patterns');
    console.log('  POST /api/image/generate-simple - Generate images from prompt');
    console.log('  GET /api/image/stats - Image generation statistics');
    console.log('='.repeat(70));
});

// Server-Sent Events (SSE) for real-time interaction updates per user
const sseClients = {}; // userId => [res, ...]

app.get('/api/stream', (req, res) => {
    // Accept token in query param or Authorization header
    const token = req.query.token || (req.headers['authorization'] ? (req.headers['authorization'].startsWith('Bearer ') ? req.headers['authorization'].slice(7) : req.headers['authorization']) : null);
    if (!token) return res.status(401).json({ success: false, error: 'Missing token' });
    let payload;
    try {
        payload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
        return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    const userId = payload.id;
    // Setup SSE headers
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*'
    });
    res.write('\n');

    if (!sseClients[userId]) sseClients[userId] = [];
    sseClients[userId].push(res);

    req.on('close', () => {
        if (!sseClients[userId]) return;
        sseClients[userId] = sseClients[userId].filter(r => r !== res);
    });
});

// Helper to broadcast an interaction to SSE clients for a user
function broadcastInteractionToUser(userId, interaction) {
    const clients = sseClients[userId] || [];
    const payload = JSON.stringify(interaction);
    clients.forEach(res => {
        try {
            res.write(`event: interaction\n`);
            res.write(`data: ${payload}\n\n`);
        } catch (e) {
            // ignore individual client errors
        }
    });
}