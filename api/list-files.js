import fs from 'fs';
import path from 'path';

function listDir(dir) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    return entries.map(e => ({ name: e.name, type: e.isDirectory() ? 'dir' : 'file' }));
  } catch (err) {
    return { error: String(err) };
  }
}

export default (req, res) => {
  const cwd = process.cwd();
  const publicDir = path.join(cwd, 'public');
  const distSpa = path.join(cwd, 'dist', 'spa');

  const result = {
    cwd,
    public: listDir(publicDir),
    dist_spa: listDir(distSpa),
    files_root: listDir(cwd),
  };

  res.setHeader('Content-Type', 'application/json');
  res.statusCode = 200;
  res.end(JSON.stringify(result, null, 2));
};
