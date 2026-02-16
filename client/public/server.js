const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Serve static files from this directory
app.use(express.static(path.join(__dirname)));

// Fallback to index.html for SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n${'='*50}`);
    console.log('🌐 Frontend Server Running');
    console.log(`${'='*50}`);
    console.log(`\n📍 Local:   http://localhost:${PORT}`);
    console.log(`🌐 Network: http://127.0.0.1:${PORT}`);
    console.log(`\n✅ Backend available at: http://localhost:3001`);
    console.log(`\n${'='*50}\n`);
});
