/**
 * Moderation System Demo & Tests
 * Shows how the content filtering works
 */

const ContentModerator = require('../src/services/moderation');
const path = require('path');

// Initialize moderator
const moderator = new ContentModerator(path.join(__dirname, '../data'));

console.log('\n🛡️  Content Moderation System Demo\n');
console.log('=' .repeat(70));

// Test cases
const testCases = [
    {
        text: "I think AI is amazing!",
        label: "Safe content"
    },
    {
        text: "You're stupid and I hate you",
        label: "Harassment"
    },
    {
        text: "I hate all people who are different",
        label: "Hate speech"
    },
    {
        text: "I'm thinking about kys",
        label: "Self-harm (CRITICAL)"
    },
    {
        text: "This sucks, can we try again?",
        label: "Mild profanity"
    },
    {
        text: "Help me with my homework",
        label: "Neutral request"
    },
    {
        text: "You're an idiot moron",
        label: "Harassment"
    }
];

// Run tests
console.log('\n📝 TESTING CONTENT MODERATION\n');

testCases.forEach((testCase, index) => {
    const result = moderator.processUserInput(testCase.text);
    
    console.log(`\n${index + 1}. ${testCase.label}`);
    console.log(`   Input: "${testCase.text}"`);
    console.log(`   Action: ${result.action}`);
    console.log(`   Severity: ${result.analysis.severity}`);
    
    if (result.analysis.flags.length > 0) {
        console.log(`   Flags:`);
        result.analysis.flags.forEach(flag => {
            console.log(`     - ${flag.category} (${flag.severity})`);
        });
    }
    
    console.log(`   Response: "${result.response}"`);
    console.log(`   Allowed: ${result.isAllowed}`);
});

console.log('\n' + '=' .repeat(70));

// Show moderation statistics
const stats = moderator.getModerationStats();
console.log('\n📊 MODERATION STATISTICS');
console.log(`   Total Flagged: ${stats.totalFlagged}`);
console.log(`   Critical Severity: ${stats.critical}`);
console.log(`   High Severity: ${stats.high}`);
console.log(`   Medium Severity: ${stats.medium}`);

// Show how to add custom patterns
console.log('\n\n🔧 CUSTOMIZATION EXAMPLES');
console.log('=' .repeat(70));

console.log('\nAdd custom harmful pattern:');
console.log(`
moderator.addHarmfulPattern(
    'badword|another-bad-word',
    'high',
    'custom_category'
);
`);

console.log('\nChange confidence threshold:');
console.log(`
moderator.confidenceThreshold = 0.8;
`);

console.log('\nGet flagged content by severity:');
console.log(`
const criticalItems = moderator.getFlaggedContent({ severity: 'critical' });
`);

console.log('\nGet flagged content by category:');
console.log(`
const hateSpeech = moderator.getFlaggedContent({ category: 'hate_speech' });
`);

console.log('\n' + '=' .repeat(70));
console.log('\n✅ Moderation system is ready to integrate!\n');
