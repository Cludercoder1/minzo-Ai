# 🎓 AI Training Guide - Abusive Content Detection

This guide walks you through training your Minzo AI to recognize and handle abusive content.

## Quick Start

### Step 1: Prepare Your Training Data

Make sure you have your CSV file at: `processed_data/training_dataset.csv`

**Expected CSV columns:**
- `text` or `content` - The text sample
- `is_abusive` - Boolean (true/false or 1/0)
- `category` (optional) - Type of content (e.g., "harassment", "hate speech", "spam")
- `severity` (optional) - Level (e.g., "low", "medium", "high")

**Example CSV format:**
```
text,is_abusive,category,severity
"You're awesome!",false,praise,low
"Go kill yourself",true,hate_speech,high
"Check out this link",false,promotional,low
```

### Step 2: Train Using Python + Pandas

```bash
cd backend

# Install pandas if needed
pip install pandas

# Process and prepare your training data
python scripts/prepare-training-data.py processed_data/training_dataset.csv
```

This will:
- ✅ Load your CSV with pandas
- 📊 Extract abusive samples
- 🔍 Generate insights
- 💾 Export as training_data.json

### Step 3: Train the AI

```bash
# Install csv-parser if needed
npm install csv-parser

# Run the training script
node scripts/train-moderation-model.js processed_data/training_dataset.csv
```

The script will:
- 📚 Learn from all samples in your CSV
- 🎯 Extract keywords and patterns from abusive content
- 💾 Save to moderation-patterns.json
- 📈 Update your knowledge base

## How It Works

### Training Process
1. **Sample Processing**: Each row in your CSV becomes a training sample
2. **Keyword Extraction**: Words from abusive content are flagged
3. **Pattern Storage**: Abuse patterns are stored for detection
4. **Knowledge Integration**: All data is added to your AI's knowledge base

### What Gets Saved

#### `data/moderation-patterns.json`
```json
{
  "abusivePatterns": [...],     // Exact phrases to watch for
  "safePatterns": [...],         // Known safe content
  "keywords": {                  // Keyword risk scores
    "badword": { "count": 5, "isAbusive": 5 }
  },
  "statistics": {
    "totalTrained": 1000,
    "abusiveCount": 350,
    "safeCount": 650
  }
}
```

#### `data/knowledge-base.json` (Updated)
All samples are added to your AI's knowledge base with:
- Confidence scores
- Categories
- Safety flags for abusive content

## Using Moderation in Your API

Add this to your `backend/server.js`:

```javascript
const ModerationEngine = require('./src/services/moderationEngine');

// Initialize after app setup
const moderator = new ModerationEngine(path.join(__dirname, 'data'));

// Check content before processing
app.post('/api/check-content', (req, res) => {
    const { text } = req.body;
    const result = moderator.detectAbusiveContent(text);
    
    res.json({
        safe: !result.isAbusive,
        confidence: result.confidence,
        flags: result.flags
    });
});

// Get moderation stats
app.get('/api/moderation-stats', (req, res) => {
    res.json(moderator.getStatistics());
});
```

## Advanced: Training Loop

For continuous learning:

```bash
# Train periodically with new data
watch "node scripts/train-moderation-model.js processed_data/training_dataset.csv"

# Or create a cron job on Linux/Mac:
# 0 */6 * * * cd /path/to/backend && node scripts/train-moderation-model.js
```

## Monitoring

Check training progress:

```bash
# View training logs
cat data/training-log.json

# Check current moderation statistics
# Use the API endpoint or:
cat data/moderation-patterns.json | grep statistics
```

## Troubleshooting

### "File not found"
- Check CSV path is correct: `processed_data/training_dataset.csv`
- Make sure file exists and is readable

### "CSV columns not found"
- Verify column names: `text`, `is_abusive`, `category`, `severity`
- Update script if you use different column names

### Low detection accuracy
- Increase training data size (more examples = better patterns)
- Check CSV data quality - remove corrupted rows
- Adjust confidence threshold (default: 0.7)

## Tips for Better Training

1. **Diverse Data**: Include various types of abusive content
2. **Label Accuracy**: Ensure is_abusive column is correct
3. **Categories**: Use specific categories for better classification
4. **Regular Updates**: Retrain periodically with new data
5. **Clean Data**: Remove empty rows or corrupted entries

## Performance Notes

- Training 1,000 samples: ~100ms
- Detection per request: ~5ms
- Memory usage: ~2MB per 10,000 unique keywords

---

Your AI is now smarter at detecting harmful content! 🎉
