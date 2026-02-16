# Auto-Naming Chat Feature

## Overview
Chat conversations are now **automatically named** based on the user's query topic. When a new chat is created, it starts with a generic name like "Chat [timestamp]", but gets automatically renamed to a meaningful title derived from the first message or the detected topic.

## Features Implemented

### 1. **Intelligent Title Generation**
- **User Message Based**: When the user sends the first message, the chat title is automatically generated from that message
- **Topic Based**: If available, the AI response topic metadata is used to create a more accurate title
- **Character Limit**: Titles are limited to 50 characters with ellipsis (...) for longer text
- **Smart Sentence Extraction**: Extracts the first meaningful sentence if possible

### 2. **Topic Detection** (Backend)
Added topic extraction in the `/api/chat` endpoint that automatically identifies the conversation topic:

**Supported Topics:**
- 🏥 Health (health, doctor, medicine, hospital, symptom, disease, treatment)
- 💻 Technology (tech, software, hardware, code, programming, AI, machine learning)
- 💕 Romance (love, romantic, relationship, date, partner, crush)
- 📚 Education (learn, study, school, university, course, teaching)
- 💼 Business (business, company, startup, entrepreneurship, sales)
- ⚽ Sports (sport, game, team, player, coach, league)
- ✈️ Travel (travel, trip, vacation, hotel, flight, destination)
- 🍕 Food (food, recipe, cook, restaurant, cuisine, meal)
- 📌 General (default for non-matching queries)

### 3. **Frontend Implementation**

#### New Functions:
```javascript
// Generate title from text by extracting first sentence or first 50 chars
generateChatTitle(text)

// Auto-rename chat if still has generic title
autoRenameChatIfNeeded(chatId)
```

#### Enhanced Chat Object:
```javascript
{
    id: 'chat_1234567890',
    title: 'How to learn JavaScript',        // Auto-generated title
    createdAt: '2026-01-01T00:00:00.000Z',
    messages: [...],
    autoNamingDone: false                    // Tracks if auto-naming was applied
}
```

#### Smart Renaming Logic:
1. Chat starts with generic name: `"Chat 01/01/2026, 12:00:00 AM"`
2. When user sends first message → Title updates to user's query (e.g., `"How to learn JavaScript"`)
3. When AI responds with topic metadata → Title updates to topic if more accurate
4. Once renamed, manual edits (if added) won't be overwritten

### 4. **Backend Response Enhancement**

The `/api/chat` endpoint now returns:
```json
{
    "success": true,
    "response": "AI response text here...",
    "topic": "Technology",              // New: Auto-detected topic
    "type": "text",                     // Message type
    "confidence": 0.85,                 // Confidence score
    "fromModerator": false,
    "flagged": false
}
```

## Usage

### For Users:
1. **Start a new chat** - Click "New Chat" or "➕" button
2. **Type your query** - Any topic (health, technology, romance, education, etc.)
3. **Hit Enter or click send** - Chat is automatically named based on your query
4. **Sidebar updates** - The chat appears in the sidebar with the new title

### Example Flow:
```
User: "What's the best way to improve my Python skills?"
                                        ↓
Chat Title Auto-Generated: "What's the best way to improve my Python skills?"
                                        ↓
Sidebar shows: "What's the best way to i..." (truncated for display)
```

## Technical Details

### Frontend Changes (`client/public/index.html`):

1. **Added `generateChatTitle(text)` function**
   - Extracts first sentence or first 50 characters
   - Handles whitespace normalization
   - Adds ellipsis for long titles

2. **Updated `createNewChat(title)` function**
   - Initializes `autoNamingDone` flag to track auto-naming status
   - Prevents duplicate auto-naming operations

3. **Enhanced `addMessageToChat()` function**
   - Detects generic titles
   - Applies auto-naming on first user or assistant message
   - Uses topic from metadata when available
   - Persists changes to localStorage

4. **Improved `performSearch()` function**
   - Ensures chat is created before adding messages
   - Triggers auto-naming through the message addition process

### Backend Changes (`backend/src/routes/moderation.js`):

1. **Added `extractTopic(text)` function**
   - Keyword-based topic detection
   - 8 predefined topic categories
   - Extensible for custom topics

2. **Enhanced `/api/chat` endpoint**
   - Extracts topic from incoming message
   - Returns topic in response
   - Supports both `message` and `text` parameter names
   - Includes confidence score

## Future Enhancements

### Phase 2 - Advanced NLP:
- [ ] Use `natural` npm package for better NLP
- [ ] Implement entity extraction (e.g., detect "JavaScript" as main entity)
- [ ] Add sentiment analysis
- [ ] Use machine learning for title generation

### Phase 3 - Manual Editing:
- [ ] Allow users to edit chat titles by clicking on them
- [ ] Track user-edited titles (don't auto-rename after manual edit)
- [ ] Provide title suggestions based on conversation history

### Phase 4 - Multi-language Support:
- [ ] Detect language of user input
- [ ] Generate titles in appropriate language
- [ ] Support keyword matching in multiple languages

### Phase 5 - Advanced Categorization:
- [ ] Use conversation context (first 3-5 exchanges)
- [ ] Implement hierarchical topic categorization
- [ ] Add sub-topics (e.g., "Python Programming" instead of just "Technology")

## Testing

### Manual Testing Steps:
1. Open MinzoAI application
2. Click "New Chat" - note generic title like "Chat 01/01/2026..."
3. Type: "Tell me about machine learning"
4. Press Enter
5. Observe: Chat title updates to "Tell me about machine learning" in sidebar
6. Check localStorage: Title should be persisted
7. Refresh page: Chat should retain the new title

### Test Cases:
- ✅ Short queries (< 50 chars): Full title displayed
- ✅ Long queries (> 50 chars): Title truncated with ellipsis
- ✅ Special characters: Properly handled
- ✅ Numbers in queries: Preserved in title
- ✅ Multiple sentences: First sentence extracted
- ✅ Topic detection: Correct category identified
- ✅ Persistence: Titles survive page refresh
- ✅ Sidebar display: Titles render correctly with truncation

## Browser Compatibility

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers

## Performance Considerations

- **Lightweight**: No external dependencies required
- **Instant**: Title generation happens synchronously
- **Efficient**: Keyword matching uses simple string operations
- **Storage**: Extra `autoNamingDone` flag adds < 50 bytes per chat

## Security Notes

- All title generation happens on the client side
- Backend topic detection doesn't expose user data
- Titles are sanitized before display (XSS protection maintained)
- localStorage remains the same (already secure)

## Support & Troubleshooting

### Chat title not updating?
1. Check browser console for errors
2. Verify localStorage is enabled
3. Ensure message was added successfully
4. Try refreshing the page

### Title showing as generic?
1. Wait 1-2 seconds after sending message
2. Check if topic detection is working (inspect response)
3. Try a query with clearer keywords

### Topic not detected correctly?
1. This is normal for ambiguous queries
2. System defaults to "General" for unmatched topics
3. Topic can be manually corrected in future updates
