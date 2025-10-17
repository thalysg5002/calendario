// Simulação de banco de dados em memória
let eventos = [];
let nextId = 1;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
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
      const { id, titulo, descricao, data_inicio, data_fim, igreja_id } = req.body;
      const index = eventos.findIndex(e => e.id === id);
      if (index !== -1) {
        eventos[index] = { ...eventos[index], titulo, descricao, data_inicio, data_fim, igreja_id };
        return res.status(200).json(eventos[index]);
      }
      return res.status(404).json({ error: 'Evento não encontrado' });
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      eventos = eventos.filter(e => e.id !== id);
      return res.status(204).end();
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Erro na API eventos:', error);
    return res.status(500).json({ error: error.message });
  }
};
