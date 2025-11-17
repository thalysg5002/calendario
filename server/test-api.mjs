const base = 'http://localhost:8080';

async function req(path, opts = {}){
  const url = base + path;
  try {
    const res = await fetch(url, opts);
    const text = await res.text();
    console.log(path, res.status, text);
    return { status: res.status, text };
  } catch (err) {
    console.error('REQUEST_ERROR', path, err.message);
    return { error: err.message };
  }
}

async function run(){
  await req('/api/test');
  await req('/api/igrejas');
  await req('/api/igrejas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome:'IgrejaX', endereco:'Rua X', presidente:'Z' }) });
  await req('/api/igrejas');
  await req('/api/eventos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ titulo:'E1', descricao:'D', data_inicio:'2025-12-01', data_fim:'2025-12-02', igreja_id:1 }) });
  await req('/api/eventos');
}

run();
