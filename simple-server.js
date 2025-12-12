const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  
  if (req.method === 'POST' && req.url === '/api/generate-text') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const { prompt } = JSON.parse(body);
      res.end(JSON.stringify({
        success: true,
        text: `MinzoFoundation AI response to: "${prompt}". The system is working! ✅`,
        timestamp: new Date().toISOString()
      }));
    });
  } else {
    res.end(JSON.stringify({ status: 'OK', service: 'MinzoFoundation AI' }));
  }
});

server.listen(3001, () => {
  console.log('🚀 Server running on http://localhost:3001');
});