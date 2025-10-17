import type { VercelRequest, VercelResponse } from '@vercel/node';
import Database from 'better-sqlite3';
import path from 'path';

// Inicializar banco de dados
const dbPath = path.join('/tmp', 'db.json');
let db: any;

try {
  db = new Database(dbPath);
  
  // Criar tabelas se não existirem
  db.exec(`
    CREATE TABLE IF NOT EXISTS igrejas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      endereco TEXT,
      presidente TEXT,
      coordenador_area TEXT,
      coordenadora_ir TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
} catch (error) {
  console.error('Erro ao inicializar DB:', error);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const igrejas = db.prepare('SELECT * FROM igrejas ORDER BY nome').all();
      return res.status(200).json(igrejas);
    }

    if (req.method === 'POST') {
      const { nome, endereco, presidente, coordenador_area, coordenadora_ir } = req.body;
      
      const result = db.prepare(`
        INSERT INTO igrejas (nome, endereco, presidente, coordenador_area, coordenadora_ir)
        VALUES (?, ?, ?, ?, ?)
      `).run(nome, endereco, presidente, coordenador_area, coordenadora_ir);
      
      const igreja = db.prepare('SELECT * FROM igrejas WHERE id = ?').get(result.lastInsertRowid);
      return res.status(201).json(igreja);
    }

    if (req.method === 'PUT') {
      const { id, nome, endereco, presidente, coordenador_area, coordenadora_ir } = req.body;
      
      db.prepare(`
        UPDATE igrejas 
        SET nome = ?, endereco = ?, presidente = ?, coordenador_area = ?, coordenadora_ir = ?
        WHERE id = ?
      `).run(nome, endereco, presidente, coordenador_area, coordenadora_ir, id);
      
      const igreja = db.prepare('SELECT * FROM igrejas WHERE id = ?').get(id);
      return res.status(200).json(igreja);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      db.prepare('DELETE FROM igrejas WHERE id = ?').run(id);
      return res.status(204).end();
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Erro na API igrejas:', error);
    return res.status(500).json({ error: error.message });
  }
}
