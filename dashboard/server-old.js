const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3333;
const HOST = '0.0.0.0'; // Listen on all interfaces (including Tailscale)
const DIR = __dirname;

const mimeTypes = {
  '.html': 'text/html',
  '.json': 'application/json',
  '.js': 'text/javascript',
  '.css': 'text/css'
};

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);

  // Handle PUT for saving tasks
  if (req.method === 'PUT' && req.url.startsWith('/tasks.json')) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        fs.writeFileSync(path.join(DIR, 'tasks.json'), JSON.stringify(data, null, 2));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // Serve static files
  let filePath = req.url.split('?')[0];
  if (filePath === '/') filePath = '/index.html';
  
  const fullPath = path.join(DIR, filePath);
  const ext = path.extname(fullPath);
  
  fs.readFile(fullPath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
    res.end(data);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`🪨 Howard Dashboard running at:`);
  console.log(`   Local:     http://localhost:${PORT}`);
  console.log(`   Tailscale: http://brians-mac-mini:${PORT}`);
  console.log(`              http://100.122.230.53:${PORT}`);
});
