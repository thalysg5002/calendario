// Simulação de banco de dados em memória
// Simulação de banco de dados em memória
let eventos = [];
let nextId = 1;

function extractId(req) {
  const m = req.url.match(/(?:\/api)?\/eventos\/(\d+)/);
  return m ? Number(m[1]) : null;
}

export default async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const id = extractId(req);
      if (id) {
        const found = eventos.find(e => e.id === id);
        if (!found) return res.status(404).json({ error: 'Evento não encontrado' });
        return res.status(200).json(found);
      }
      return res.status(200).json(eventos);
    }

    if (req.method === 'POST') {
      const { titulo, descricao, data_inicio, data_fim, igreja_id } = req.body;
      const evento = {
        id: nextId++,
        titulo,
        descricao,
        data_inicio,
        data_fim,
        igreja_id,
        created_at: new Date().toISOString()
      };
      eventos.push(evento);
      return res.status(201).json(evento);
    }

    if (req.method === 'PUT') {
      const idFromPath = extractId(req);
      const { id: idFromBody, titulo, descricao, data_inicio, data_fim, igreja_id } = req.body || {};
      const id = idFromPath || idFromBody;
      if (!id) return res.status(400).json({ error: 'ID obrigatório para atualizar' });
      const index = eventos.findIndex(e => e.id === id);
      if (index !== -1) {
        eventos[index] = { ...eventos[index], titulo, descricao, data_inicio, data_fim, igreja_id };
        return res.status(200).json(eventos[index]);
      }
      return res.status(404).json({ error: 'Evento não encontrado' });
    }

    if (req.method === 'DELETE') {
      const idFromPath = extractId(req);
      const { id: idFromBody } = req.body || {};
      const id = idFromPath || idFromBody;
      if (!id) return res.status(400).json({ error: 'ID obrigatório para deletar' });
      eventos = eventos.filter(e => e.id !== id);
      return res.status(204).end();
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Erro na API eventos:', error);
    return res.status(500).json({ error: error.message });
  }
};
