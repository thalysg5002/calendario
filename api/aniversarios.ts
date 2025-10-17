import type { VercelRequest, VercelResponse } from '@vercel/node';
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join('/tmp', 'db.json');
let db: any;

try {
  db = new Database(dbPath);
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS aniversarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      data_nascimento TEXT NOT NULL,
      igreja_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (igreja_id) REFERENCES igrejas(id)
    )
  `);
} catch (error) {
  console.error('Erro ao inicializar DB:', error);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const { mes } = req.query;
      
      let query = `
        SELECT a.*, i.nome as igreja_nome 
        FROM aniversarios a
        LEFT JOIN igrejas i ON a.igreja_id = i.id
      `;
      
      if (mes) {
        query += ` WHERE strftime('%m', a.data_nascimento) = ?`;
        const aniversarios = db.prepare(query).all(String(mes).padStart(2, '0'));
        return res.status(200).json(aniversarios);
      }
      
      const aniversarios = db.prepare(query + ' ORDER BY a.data_nascimento').all();
      return res.status(200).json(aniversarios);
    }

    if (req.method === 'POST') {
      const { nome, data_nascimento, igreja_id } = req.body;
      
      const result = db.prepare(`
        INSERT INTO aniversarios (nome, data_nascimento, igreja_id)
        VALUES (?, ?, ?)
      `).run(nome, data_nascimento, igreja_id);
      
      const aniversario = db.prepare('SELECT * FROM aniversarios WHERE id = ?').get(result.lastInsertRowid);
      return res.status(201).json(aniversario);
    }

    if (req.method === 'PUT') {
      const { id, nome, data_nascimento, igreja_id } = req.body;
      
      db.prepare(`
        UPDATE aniversarios 
        SET nome = ?, data_nascimento = ?, igreja_id = ?
        WHERE id = ?
      `).run(nome, data_nascimento, igreja_id, id);
      
      const aniversario = db.prepare('SELECT * FROM aniversarios WHERE id = ?').get(id);
      return res.status(200).json(aniversario);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      db.prepare('DELETE FROM aniversarios WHERE id = ?').run(id);
      return res.status(204).end();
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Erro na API aniversarios:', error);
    return res.status(500).json({ error: error.message });
  }
}
