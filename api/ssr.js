import fs from 'fs';
import path from 'path';

// Use process.cwd() so the function resolves the build output path in Vercel runtime
const base = path.join(process.cwd(), 'dist', 'spa');

function contentType(file) {
  const ext = path.extname(file).toLowerCase();
  const map = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.json': 'application/json',
    '.ico': 'image/x-icon',
    '.map': 'application/json',
  };
  return map[ext] || 'application/octet-stream';
}

export default (req, res) => {
  try {
    let urlPath = req.url.split('?')[0];
    if (!urlPath || urlPath === '/') urlPath = '/index.html';
    // sanitize
    urlPath = decodeURIComponent(urlPath);
    const filePath = path.join(base, urlPath);

    // prevent path traversal
    if (!filePath.startsWith(base)) {
      res.statusCode = 400;
      res.end('Bad request');
      return;
    }

    const servePath = fs.existsSync(filePath) ? filePath : path.join(base, 'index.html');
    const data = fs.readFileSync(servePath);
    res.setHeader('Content-Type', contentType(servePath));
    res.statusCode = 200;
    res.end(data);
  } catch (err) {
    console.error('SSR function error', err);
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
};
