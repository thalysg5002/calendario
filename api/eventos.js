const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join('/tmp', 'db.sqlite');
let db;

try {
  db = new Database(dbPath);
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS eventos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      descricao TEXT,
      data_inicio TEXT NOT NULL,
      data_fim TEXT,
      igreja_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (igreja_id) REFERENCES igrejas(id)
    )
  `);
} catch (error) {
  console.error('Erro ao inicializar DB:', error);
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const eventos = db.prepare(`
        SELECT e.*, i.nome as igreja_nome 
        FROM eventos e
        LEFT JOIN igrejas i ON e.igreja_id = i.id
        ORDER BY e.data_inicio
      `).all();
      return res.status(200).json(eventos);
    }

    if (req.method === 'POST') {
      const { titulo, descricao, data_inicio, data_fim, igreja_id } = req.body;
      
      const result = db.prepare(`
        INSERT INTO eventos (titulo, descricao, data_inicio, data_fim, igreja_id)
        VALUES (?, ?, ?, ?, ?)
      `).run(titulo, descricao, data_inicio, data_fim, igreja_id);
      
      const evento = db.prepare('SELECT * FROM eventos WHERE id = ?').get(result.lastInsertRowid);
      return res.status(201).json(evento);
    }

    if (req.method === 'PUT') {
      const { id, titulo, descricao, data_inicio, data_fim, igreja_id } = req.body;
      
      db.prepare(`
        UPDATE eventos 
        SET titulo = ?, descricao = ?, data_inicio = ?, data_fim = ?, igreja_id = ?
        WHERE id = ?
      `).run(titulo, descricao, data_inicio, data_fim, igreja_id, id);
      
      const evento = db.prepare('SELECT * FROM eventos WHERE id = ?').get(id);
      return res.status(200).json(evento);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      db.prepare('DELETE FROM eventos WHERE id = ?').run(id);
      return res.status(204).end();
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Erro na API eventos:', error);
    return res.status(500).json({ error: error.message });
  }
};
