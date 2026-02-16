/**
 * Hinglish Romantic Training Script
 * Teaches your AI lovey-dovey responses in Hindi-English mix
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = path.join(__dirname, '../data');
const KNOWLEDGE_BASE_FILE = path.join(DATA_DIR, 'knowledge-base.json');
const ROMANTIC_TRAINING_LOG = path.join(DATA_DIR, 'romantic-training.json');

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

function loadRomanticDataset() {
    const datasetFile = path.join(DATA_DIR, 'hinglish_romantic_dataset.json');
    try {
        if (fs.existsSync(datasetFile)) {
            return JSON.parse(fs.readFileSync(datasetFile, 'utf8'));
        }
    } catch (e) {
        console.error('❌ Could not load dataset:', e.message);
        process.exit(1);
    }
    return null;
}

function trainOnRomanticData(dataset, knowledgeBase) {
    console.log('\n💑 Training AI on Hinglish Romantic Responses');
    console.log('=' .repeat(70));

    let trained = 0;

    // Train on main dataset
    if (dataset.dataset) {
        dataset.dataset.forEach(item => {
            const { input, response, translation, category } = item;

            // Add to knowledge base
            const entry = {
                response: response,
                confidence: 0.95,
                interactions: 0,
                categories: ['romantic', category],
                language: 'hinglish',
                translation: translation,
                sourceId: uuidv4(),
                timestamp: new Date().toISOString()
            };

            if (!knowledgeBase[input]) {
                knowledgeBase[input] = entry;
            } else {
                knowledgeBase[input].interactions++;
            }

            trained++;
        });

        console.log(`\n📚 Dataset Training:`);
        console.log(`   ✅ Trained ${trained} romantic exchanges`);
    }

    // Add romantic phrases as responses
    if (dataset.romantic_phrases) {
        dataset.romantic_phrases.forEach(phrase => {
            knowledgeBase[`romantic_phrase_${uuidv4()}`] = {
                response: phrase,
                confidence: 0.9,
                interactions: 0,
                categories: ['romantic', 'phrases'],
                language: 'hinglish',
                isPhrase: true,
                timestamp: new Date().toISOString()
            };
        });

        console.log(`   ✨ Added ${dataset.romantic_phrases.length} romantic phrases`);
    }

    // Add flirty lines
    if (dataset.flirty_lines) {
        dataset.flirty_lines.forEach(line => {
            knowledgeBase[`flirty_line_${uuidv4()}`] = {
                response: line,
                confidence: 0.9,
                interactions: 0,
                categories: ['romantic', 'flirting'],
                language: 'hinglish',
                isFlirtyLine: true,
                timestamp: new Date().toISOString()
            };
        });

        console.log(`   😊 Added ${dataset.flirty_lines.length} flirty pickup lines`);
    }

    // Train on conversation patterns
    if (dataset.conversation_patterns) {
        dataset.conversation_patterns.forEach(pattern => {
            const context = pattern.context;
            pattern.lines.forEach((line, index) => {
                knowledgeBase[`conversation_${context}_${index}`] = {
                    response: line.text,
                    confidence: 0.9,
                    interactions: 0,
                    categories: ['romantic', 'conversations', context],
                    language: 'hinglish',
                    speaker: line.speaker,
                    contextType: context,
                    timestamp: new Date().toISOString()
                };
            });
        });

        console.log(`   💬 Added ${dataset.conversation_patterns.length} conversation patterns`);
    }

    console.log('=' .repeat(70));
    return knowledgeBase;
}

function saveTrainingData(knowledgeBase) {
    try {
        fs.writeFileSync(KNOWLEDGE_BASE_FILE, JSON.stringify(knowledgeBase, null, 2));

        // Log training
        const log = {
            timestamp: new Date().toISOString(),
            trainingType: 'hinglish_romantic',
            status: 'success',
            totalEntriesInKB: Object.keys(knowledgeBase).length
        };

        fs.writeFileSync(ROMANTIC_TRAINING_LOG, JSON.stringify(log, null, 2));

        console.log('\n✅ Training Complete!');
        console.log('=' .repeat(70));
        console.log(`📊 Statistics:`);
        console.log(`   Total knowledge base entries: ${Object.keys(knowledgeBase).length}`);
        console.log(`   Romantic category entries: ${
            Object.values(knowledgeBase).filter(kb => 
                kb.categories && kb.categories.includes('romantic')
            ).length
        }`);

    } catch (e) {
        console.error('Error saving training data:', e.message);
        process.exit(1);
    }
}

function printTrainingInfo(dataset) {
    console.log('\n📋 Dataset Information:');
    console.log(`   Categories: ${dataset.categories.join(', ')}`);
    console.log(`   Main examples: ${dataset.dataset.length}`);
    console.log(`   Romantic phrases: ${dataset.romantic_phrases.length}`);
    console.log(`   Flirty lines: ${dataset.flirty_lines.length}`);
    console.log(`   Conversation patterns: ${dataset.conversation_patterns.length}`);
}

// Main execution
const dataset = loadRomanticDataset();
if (!dataset) {
    console.error('❌ Failed to load romantic dataset');
    process.exit(1);
}

console.log('\n🎓 Hinglish Romantic Response Training');
console.log('=' .repeat(70));

printTrainingInfo(dataset);

const knowledgeBase = loadKnowledgeBase();
const trainedKB = trainOnRomanticData(dataset, knowledgeBase);
saveTrainingData(trainedKB);

console.log('\n💕 Your AI is now fluent in romantic Hinglish!');
console.log('=' .repeat(70));
console.log('\nExample responses:');
console.log('  Input:  "Tumhari smile meri day ban jati hai"');
console.log('  Output: "Tumhara pyaar hi meri smile ka reason hai"');
console.log('\n  Input:  "Missing you like crazy"');
console.log('  Output: "Same here, time tumhare saath hi fast chalta hai"');
console.log('\n💑 Ready for romantic conversations!\n');
