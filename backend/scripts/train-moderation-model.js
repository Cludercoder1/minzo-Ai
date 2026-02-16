const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { v4: uuidv4 } = require('uuid');

/**
 * Training Script: Load abusive samples from CSV and teach the AI moderation model
 * This integrates labeled data into the knowledge base and moderation patterns
 */

const DATA_DIR = path.join(__dirname, '../data');
const KNOWLEDGE_BASE_FILE = path.join(DATA_DIR, 'knowledge-base.json');
const MODERATION_PATTERNS_FILE = path.join(DATA_DIR, 'moderation-patterns.json');
const TRAINING_LOG_FILE = path.join(DATA_DIR, 'training-log.json');

// Load knowledge base
function loadKnowledgeBase() {
    try {
        if (fs.existsSync(KNOWLEDGE_BASE_FILE)) {
            return JSON.parse(fs.readFileSync(KNOWLEDGE_BASE_FILE, 'utf8'));
        }
    } catch (e) {
        console.warn('Could not load knowledge base');
    }
    return {};
}

// Load or create moderation patterns
function loadModerationPatterns() {
    try {
        if (fs.existsSync(MODERATION_PATTERNS_FILE)) {
            return JSON.parse(fs.readFileSync(MODERATION_PATTERNS_FILE, 'utf8'));
        }
    } catch (e) {
        console.warn('Could not load moderation patterns');
    }
    return {
        abusivePatterns: [],
        safePatterns: [],
        keywords: {},
        statistics: { totalTrained: 0, abusiveCount: 0, safeCount: 0 }
    };
}

// Extract keywords from text
function extractKeywords(text) {
    return text.toLowerCase()
        .split(/\W+/)
        .filter(word => word.length > 3);
}

// Train on a single sample
function trainOnSample(sample, knowledgeBase, patterns) {
    const { text, is_abusive, category = 'general' } = sample;
    
    if (!text) return;

    const keywords = extractKeywords(text);
    const sampleId = uuidv4();
    
    if (is_abusive) {
        // Add to abusive patterns for detection
        patterns.abusivePatterns.push({
            id: sampleId,
            text: text,
            category: category,
            severity: sample.severity || 'medium',
            timestamp: new Date().toISOString(),
            keywords: keywords
        });
        patterns.statistics.abusiveCount++;
        
        // Track keywords associated with abusive content
        keywords.forEach(keyword => {
            if (!patterns.keywords[keyword]) {
                patterns.keywords[keyword] = { count: 0, isAbusive: 0 };
            }
            patterns.keywords[keyword].count++;
            patterns.keywords[keyword].isAbusive++;
        });
        
        // Add to knowledge base with warning flag
        const entry = {
            response: `[MODERATION] This content contains abusive language and has been flagged for moderation. Category: ${category}`,
            confidence: 0.95,
            interactions: 1,
            categories: ['moderation', 'safety', category],
            isAbusive: true,
            severity: sample.severity || 'medium',
            sourceId: sampleId,
            timestamp: new Date().toISOString()
        };
        
        if (!knowledgeBase[text]) {
            knowledgeBase[text] = entry;
        } else {
            knowledgeBase[text].interactions++;
            knowledgeBase[text].confidence = Math.min(0.99, knowledgeBase[text].confidence + 0.01);
        }
    } else {
        // Add to safe patterns
        patterns.safePatterns.push({
            id: sampleId,
            text: text,
            category: category,
            timestamp: new Date().toISOString(),
            keywords: keywords
        });
        patterns.statistics.safeCount++;
        
        // Track keywords in safe content
        keywords.forEach(keyword => {
            if (!patterns.keywords[keyword]) {
                patterns.keywords[keyword] = { count: 0, isAbusive: 0 };
            }
            patterns.keywords[keyword].count++;
        });
    }
}

// Save files
function saveData(knowledgeBase, patterns) {
    try {
        fs.writeFileSync(KNOWLEDGE_BASE_FILE, JSON.stringify(knowledgeBase, null, 2));
        fs.writeFileSync(MODERATION_PATTERNS_FILE, JSON.stringify(patterns, null, 2));
        
        // Log training event
        const log = {
            timestamp: new Date().toISOString(),
            totalTrained: patterns.statistics.totalTrained,
            abusiveCount: patterns.statistics.abusiveCount,
            safeCount: patterns.statistics.safeCount,
            totalKeywords: Object.keys(patterns.keywords).length
        };
        
        let logs = [];
        if (fs.existsSync(TRAINING_LOG_FILE)) {
            logs = JSON.parse(fs.readFileSync(TRAINING_LOG_FILE, 'utf8'));
        }
        logs.push(log);
        fs.writeFileSync(TRAINING_LOG_FILE, JSON.stringify(logs, null, 2));
        
        console.log('✅ Training data saved successfully');
    } catch (e) {
        console.error('Error saving training data:', e.message);
    }
}

// Main training function
function trainFromCSV(csvFilePath) {
    console.log(`\n🎓 Starting AI Training from: ${csvFilePath}`);
    console.log('=' .repeat(60));
    
    if (!fs.existsSync(csvFilePath)) {
        console.error(`❌ File not found: ${csvFilePath}`);
        process.exit(1);
    }

    const knowledgeBase = loadKnowledgeBase();
    const patterns = loadModerationPatterns();
    let sampleCount = 0;
    let abusiveCount = 0;

    fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (row) => {
            sampleCount++;
            
            // Handle different CSV column names
            const isAbusive = row.is_abusive === 'true' || row.is_abusive === 1 || row.is_abusive === true;
            const text = row.text || row.content || row.message || '';
            
            if (isAbusive) abusiveCount++;
            
            trainOnSample({
                text: text.trim(),
                is_abusive: isAbusive,
                category: row.category || row.type || 'general',
                severity: row.severity || 'medium'
            }, knowledgeBase, patterns);
        })
        .on('end', () => {
            patterns.statistics.totalTrained += sampleCount;
            
            console.log(`\n📊 Training Summary:`);
            console.log(`   Total samples processed: ${sampleCount}`);
            console.log(`   Abusive samples: ${abusiveCount}`);
            console.log(`   Safe samples: ${sampleCount - abusiveCount}`);
            console.log(`   Unique keywords learned: ${Object.keys(patterns.keywords).length}`);
            console.log(`   Cumulative training count: ${patterns.statistics.totalTrained}`);
            
            saveData(knowledgeBase, patterns);
            console.log('=' .repeat(60));
            console.log('✨ AI training complete! Your AI is now smarter at detecting abusive content.\n');
        })
        .on('error', (err) => {
            console.error('Error reading CSV file:', err.message);
            process.exit(1);
        });
}

// Run training if CSV path is provided
const csvPath = process.argv[2] || 'processed_data/training_dataset.csv';
trainFromCSV(csvPath);
