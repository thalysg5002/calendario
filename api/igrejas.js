// Simulação de banco de dados em memória (temporário para testes)
let igrejas = [];
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
      return res.status(200).json(igrejas);
    }

    if (req.method === 'POST') {
      const { nome, endereco, presidente, coordenador_area, coordenadora_ir } = req.body;
      const igreja = {
        id: nextId++,
        nome,
        endereco,
        presidente,
        coordenador_area,
        coordenadora_ir,
        created_at: new Date().toISOString()
      };
      igrejas.push(igreja);
      return res.status(201).json(igreja);
    }

    if (req.method === 'PUT') {
      const { id, nome, endereco, presidente, coordenador_area, coordenadora_ir } = req.body;
      const index = igrejas.findIndex(i => i.id === id);
      if (index !== -1) {
        igrejas[index] = { ...igrejas[index], nome, endereco, presidente, coordenador_area, coordenadora_ir };
        return res.status(200).json(igrejas[index]);
      }
      return res.status(404).json({ error: 'Igreja não encontrada' });
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      igrejas = igrejas.filter(i => i.id !== id);
      return res.status(204).end();
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Erro na API igrejas:', error);
    return res.status(500).json({ error: error.message });
  }
};
