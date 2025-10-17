const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 5000;
const base = path.join(__dirname, '..', 'dist', 'spa');

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.json': 'application/json',
    '.ico': 'image/x-icon',
  };
  const contentType = map[ext] || 'application/octet-stream';
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/index.html';
  const filePath = path.join(base, decodeURIComponent(urlPath));
  // Security: prevent path traversal
  if (!filePath.startsWith(base)) {
    res.writeHead(400);
    res.end('Bad request');
    return;
  }
  const resolved = fs.existsSync(filePath) ? filePath : path.join(base, 'index.html');
  sendFile(res, resolved);
});

server.listen(port, () => {
  console.log(`Serving ${base} on http://localhost:${port}`);
});
