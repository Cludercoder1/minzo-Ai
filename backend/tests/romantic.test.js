/**
 * Hinglish Romantic Training Demo & Test
 * Shows how the romantic response system works
 */

const fs = require('fs');
const path = require('path');
const RomanticResponseEngine = require('../src/services/romanticEngine');

// Load knowledge base
const kbFile = path.join(__dirname, '../data/knowledge-base.json');
let knowledgeBase = {};

try {
    if (fs.existsSync(kbFile)) {
        knowledgeBase = JSON.parse(fs.readFileSync(kbFile, 'utf8'));
    }
} catch (e) {
    console.warn('Could not load knowledge base');
}

// Initialize romantic engine
const romanticEngine = new RomanticResponseEngine(knowledgeBase);

console.log('\n💑 Hinglish Romantic Response System');
console.log('=' .repeat(70));

// Show statistics
const stats = romanticEngine.getStatistics();
console.log('\n📊 System Statistics:');
console.log(`   Total romantic responses: ${stats.totalRomanticResponses}`);
console.log(`   Categories: ${stats.categories.join(', ')}`);
console.log(`\n   By Category:`);
Object.entries(stats.byCategory).forEach(([category, count]) => {
    console.log(`     - ${category}: ${count} responses`);
});

// Test conversations
console.log('\n' + '=' .repeat(70));
console.log('\n💬 Test Conversations:\n');

const testInputs = [
    "Tumhari smile meri day ban jati hai",
    "Missing you like crazy",
    "Tum meri life ka best chapter ho",
    "Kya tumhara dil fast beat ho raha hai?",
    "Happy anniversary meri jaan!",
    "Har din tumhare saath bitana chahta hoon"
];

testInputs.forEach((input, index) => {
    const result = romanticEngine.processRomanticInput(input);

    console.log(`${index + 1}. User: "${input}"`);

    if (result.success) {
        console.log(`   AI: "${result.response}"`);
        console.log(`   Category: ${result.category}`);
        console.log(`   Match Score: ${(result.matchScore * 100).toFixed(0)}%`);
    } else {
        console.log(`   AI: No exact match found`);
    }

    console.log();
});

// Show romantic keyword detection
console.log('=' .repeat(70));
console.log('\n🎯 Romantic Input Detection:\n');

const testDetection = [
    "I love you so much",
    "Tell me a joke",
    "Can you help me code?",
    "You're so beautiful",
    "What's the weather?"
];

testDetection.forEach(input => {
    const isRomantic = romanticEngine.isRomanticInput(input);
    console.log(`"${input}" → ${isRomantic ? '💕 Romantic' : '📝 Regular'}`);
});

// Show random responses by category
console.log('\n' + '=' .repeat(70));
console.log('\n🎲 Random Responses by Category:\n');

const categories = romanticEngine.getCategories();
categories.slice(0, 3).forEach(category => {
    const random = romanticEngine.getRandomResponseByCategory(category);
    if (random) {
        console.log(`${category}:`);
        console.log(`  "${random.response}"`);
    }
});

// Example integration
console.log('\n' + '=' .repeat(70));
console.log('\n💡 Integration Example:\n');

console.log(`
// In your chat endpoint:
const romanticEngine = new RomanticResponseEngine(knowledgeBase);

app.post('/api/chat', (req, res) => {
    const { text } = req.body;
    
    // Check if input is romantic
    if (romanticEngine.isRomanticInput(text)) {
        const result = romanticEngine.processRomanticInput(text);
        if (result.success) {
            return res.json({ response: result.response });
        }
    }
    
    // Otherwise use regular AI
    const aiResponse = await ai.respond(text);
    res.json({ response: aiResponse });
});
`);

console.log('=' .repeat(70));
console.log('\n✨ Your AI is ready for romantic conversations! 💕\n');
