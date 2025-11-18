import { loadFromStorage, saveToStorage } from './local-storage';

/**
 * Cliente API com persistência em LocalStorage
 */

// Tipos
export interface Igreja {
  id: number;
  nome: string;
  endereco: string;
  presidente: string;
  coordenador_area: string;
  coordenadora_ir: string;
  codigoCor?: string;
  departamentos?: Array<{ id: string; nome: string }>;
  orgaos?: Array<{ id: string; nome: string }>;
  created_at?: string;
}

const DEFAULT_DEPARTAMENTOS: Array<{ id: string; nome: string }> = [
  { id: 'dejeadalpe', nome: 'DEJEADALPE' },
  { id: 'ceadalpe', nome: 'CEADALPE' },
  { id: 'craceadalpe', nome: 'CRACEADALPE' },
  { id: 'umadalpe', nome: 'UMADALPE' },
  { id: 'oracao_missionaria', nome: 'ORAÇÃO MISSIONÁRIA' },
  { id: 'circulo_oracao', nome: 'CIRCULO DE ORAÇÃO' },
  { id: 'circulo_oracao_infantil', nome: 'CIRCULO DE ORAÇÃO INFANTIL' },
  { id: 'equipe_eventos', nome: 'EQUIPE DE EVENTOS' },
  { id: 'ebd', nome: 'EBD' },
  { id: 'discipulado', nome: 'DISCIPULADO' },
];

export interface Evento {
  id: number;
  titulo: string;
  descricao: string;
  data_inicio: string;
  data_fim: string;
  igreja_id: number;
  codigoCor?: string;
  created_at?: string;
}

// Utilitário simples para gerar ids legíveis a partir de nomes
function slugify(text: string) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

export interface Aniversario {
  id: number;
  nome: string;
  data_nascimento: string;
  igreja_id: number;
  created_at?: string;
}

// === IGREJAS ===

export const igrejasAPI = {
  getAll: (): Igreja[] => {
    const igrejas = loadFromStorage<Igreja>('igrejas');
    // Migração: garantir campos que a UI espera e persistir se houver mudanças
    let changed = false;
    const mapped = igrejas.map((i) => {
      const mi: any = { ...i };
      if (!mi.codigoCor) { mi.codigoCor = '#16a34a'; changed = true; }
      if (!Array.isArray(mi.departamentos) || mi.departamentos.length === 0) { mi.departamentos = JSON.parse(JSON.stringify(DEFAULT_DEPARTAMENTOS)); changed = true; }
      // Normalizar orgaos: aceitar strings ou objetos e transformar em {id,nome}
      if (!Array.isArray(mi.orgaos)) { mi.orgaos = []; changed = true; } else {
        const normalizados = (mi.orgaos || []).map((o: any) => {
          if (!o) return null;
          if (typeof o === 'string') return { id: `${mi.id}-${slugify(o)}`, nome: o };
          if (typeof o === 'object' && (o.id || o.nome)) return { id: String(o.id ?? `${mi.id}-${slugify(o.nome ?? String(o))}`), nome: o.nome ?? String(o) };
          return null;
        }).filter((x: any) => x !== null);
        // se mudou a estrutura, marcar changed
        if (JSON.stringify(normalizados) !== JSON.stringify(mi.orgaos)) { mi.orgaos = normalizados; changed = true; }
      }
      return mi as Igreja;
    });
    if (changed) saveToStorage('igrejas', mapped as any);
    return mapped as Igreja[];
  },

  getById: (id: number): Igreja | undefined => {
    const igrejas = loadFromStorage<Igreja>('igrejas');
    return igrejas.find(i => i.id === id);
  },

  create: (data: Omit<Igreja, 'id' | 'created_at'>): Igreja => {
    const igrejas = loadFromStorage<Igreja>('igrejas');
    const nextId = igrejas.length > 0 ? Math.max(...igrejas.map(i => i.id)) + 1 : 1;
    
    const novaIgreja: Igreja = {
      ...data,
      departamentos: (data as any).departamentos && Array.isArray((data as any).departamentos) && (data as any).departamentos.length > 0 ? (data as any).departamentos : JSON.parse(JSON.stringify(DEFAULT_DEPARTAMENTOS)),
      orgaos: ((data as any).orgaos || []).map((o: any) => {
        if (!o) return null;
        if (typeof o === 'string') return { id: `${nextId}-${slugify(o)}`, nome: o };
        if (typeof o === 'object' && (o.id || o.nome)) return { id: String(o.id ?? `${nextId}-${slugify(o.nome ?? String(o))}`), nome: o.nome ?? String(o) };
        return null;
      }).filter((x: any) => x !== null),
      id: nextId,
      created_at: new Date().toISOString(),
    };
    
    igrejas.push(novaIgreja);
    saveToStorage('igrejas', igrejas);
    try { window.dispatchEvent(new CustomEvent('igrejasUpdated', { detail: { id: novaIgreja.id } })); } catch (e) { }
    
    return novaIgreja;
  },

  update: (id: number, data: Partial<Omit<Igreja, 'id'>>): Igreja | null => {
    const igrejas = loadFromStorage<Igreja>('igrejas');
    const index = igrejas.findIndex(i => i.id === id);
    
    if (index === -1) return null;
    
    // Se orgaos estiver presente como array de strings, normalizar para objetos com id estável
    const updateData: any = { ...data };
    if (Array.isArray((data as any).orgaos)) {
      const normalizedNewOrgaos = (data as any).orgaos.map((o: any) => {
        if (!o) return null;
        if (typeof o === 'string') return { id: `${id}-${slugify(o)}`, nome: o };
        if (typeof o === 'object' && (o.id || o.nome)) return { id: String(o.id ?? `${id}-${slugify(o.nome ?? String(o))}`), nome: o.nome ?? String(o) };
        return null;
      }).filter((x: any) => x !== null);
      updateData.orgaos = normalizedNewOrgaos;

      // Se houve mudanças nos nomes/ids dos órgãos, atualizar eventos que referenciam orgaoId
      try {
        const eventos = loadFromStorage<Evento>('eventos');
        const igrejaAtual = igrejas[index];
        const oldOrgaos: Array<{id: string; nome: string}> = (igrejaAtual.orgaos || []).map(o => ({ id: String((o as any).id), nome: (o as any).nome }));
        const newOrgaos: Array<{id: string; nome: string}> = normalizedNewOrgaos.map((o: any) => ({ id: String(o.id), nome: o.nome }));

        let changed = false;
        const updatedEventos = eventos.map(ev => {
          const evOrgaoId = (ev as any).orgaoId || (ev as any).orgao_id || null;
          if (!evOrgaoId) return ev;
          // if event references an old orgao id, try to map to new id by matching name
          const oldMatch = oldOrgaos.find(o => String(o.id) === String(evOrgaoId));
          if (!oldMatch) return ev;
          const newMatch = newOrgaos.find(o => o.nome === oldMatch.nome);
          if (newMatch) {
            if (String(evOrgaoId) !== String(newMatch.id)) {
              changed = true;
              return { ...ev, orgaoId: newMatch.id, orgao_id: newMatch.id } as Evento;
            }
          } else {
            // órgão foi removido or renamed without matching — clear link
            changed = true;
            return { ...ev, orgaoId: null, orgao_id: null } as Evento;
          }
          return ev;
        });
        if (changed) saveToStorage('eventos', updatedEventos);
      } catch (e) {
        // ignore event update failures
      }
    }

    igrejas[index] = { ...igrejas[index], ...updateData };

    // Se a cor foi atualizada, propagar para eventos daquela igreja
    try {
      const novaCor = (data as any).codigoCor;
      if (typeof novaCor === 'string' && novaCor.trim() !== '') {
        const eventos = loadFromStorage<Evento>('eventos');
        let changed = false;
        const updated = eventos.map(ev => {
          if (String(ev.igreja_id) === String(id)) {
            if ((ev as any).codigoCor !== novaCor) {
              changed = true;
              return { ...ev, codigoCor: novaCor } as Evento;
            }
          }
          return ev;
        });
        if (changed) {
          saveToStorage('eventos', updated);
          try { window.dispatchEvent(new CustomEvent('eventosUpdated', { detail: {} })); } catch (e) { }
        }
      }
    } catch (e) {
      // silenciosamente ignorar problemas de leitura/escrita de eventos
    }

    saveToStorage('igrejas', igrejas);
    try { window.dispatchEvent(new CustomEvent('igrejasUpdated', { detail: { id } })); } catch (e) { }

    return igrejas[index];
  },

  delete: (id: number): boolean => {
    const igrejas = loadFromStorage<Igreja>('igrejas');
    const filtered = igrejas.filter(i => i.id !== id);
    
    if (filtered.length === igrejas.length) return false;
    
    saveToStorage('igrejas', filtered);
    try { window.dispatchEvent(new CustomEvent('igrejasUpdated', { detail: { id } })); } catch (e) { }
    return true;
  },
};

// === EVENTOS ===

export const eventosAPI = {
  getAll: (): Evento[] => {
    return loadFromStorage<Evento>('eventos');
  },

  getById: (id: number): Evento | undefined => {
    const eventos = loadFromStorage<Evento>('eventos');
    return eventos.find(e => e.id === id);
  },

  getByIgreja: (igrejaId: number): Evento[] => {
    const eventos = loadFromStorage<Evento>('eventos');
    return eventos.filter(e => e.igreja_id === igrejaId);
  },

  create: (data: Omit<Evento, 'id' | 'created_at'>): Evento => {
    const eventos = loadFromStorage<Evento>('eventos');
    const nextId = eventos.length > 0 ? Math.max(...eventos.map(e => e.id)) + 1 : 1;
    
    const novoEvento: Evento = {
      ...data,
      id: nextId,
      created_at: new Date().toISOString(),
    };

    // Propagar cor da igreja para o evento, se existir
    try {
      const igrejas = loadFromStorage<Igreja>('igrejas');
      const igreja = igrejas.find(i => String(i.id) === String(data.igreja_id));
      if (igreja && igreja.codigoCor) {
        (novoEvento as any).codigoCor = igreja.codigoCor;
      }
    } catch (e) {
      // ignore
    }
    
    eventos.push(novoEvento);
    saveToStorage('eventos', eventos);
    try { window.dispatchEvent(new CustomEvent('eventosUpdated', { detail: { id: novoEvento.id } })); } catch (e) { }
    
    return novoEvento;
  },

  update: (id: number, data: Partial<Omit<Evento, 'id'>>): Evento | null => {
    const eventos = loadFromStorage<Evento>('eventos');
    const index = eventos.findIndex(e => e.id === id);
    
    if (index === -1) return null;
    
    eventos[index] = { ...eventos[index], ...data };

    // Garantir que o evento tenha codigoCor consistente com a igreja associada
    try {
      const igrejaId = (data as any).igreja_id ?? eventos[index].igreja_id;
      const igrejas = loadFromStorage<Igreja>('igrejas');
      const igreja = igrejas.find(i => String(i.id) === String(igrejaId));
      if (igreja && igreja.codigoCor) {
        (eventos[index] as any).codigoCor = igreja.codigoCor;
      }
    } catch (e) {
      // ignore
    }

    saveToStorage('eventos', eventos);
    try { window.dispatchEvent(new CustomEvent('eventosUpdated', { detail: { id } })); } catch (e) { }

    return eventos[index];
  },

  delete: (id: number): boolean => {
    const eventos = loadFromStorage<Evento>('eventos');
    const filtered = eventos.filter(e => e.id !== id);
    
    if (filtered.length === eventos.length) return false;

    saveToStorage('eventos', filtered);
    try { window.dispatchEvent(new CustomEvent('eventosUpdated', { detail: {} })); } catch (e) { }
    return true;
  },
};

// === ANIVERSÁRIOS ===

export const aniversariosAPI = {
  getAll: (): Aniversario[] => {
    return loadFromStorage<Aniversario>('aniversarios');
  },

  getById: (id: number): Aniversario | undefined => {
    const aniversarios = loadFromStorage<Aniversario>('aniversarios');
    return aniversarios.find(a => a.id === id);
  },

  getByIgreja: (igrejaId: number): Aniversario[] => {
    const aniversarios = loadFromStorage<Aniversario>('aniversarios');
    return aniversarios.filter(a => a.igreja_id === igrejaId);
  },

  getByMes: (mes: number): Aniversario[] => {
    const aniversarios = loadFromStorage<Aniversario>('aniversarios');
    return aniversarios.filter(a => {
      const month = parseInt(a.data_nascimento.split('-')[1]);
      return month === mes;
    });
  },

  create: (data: Omit<Aniversario, 'id' | 'created_at'>): Aniversario => {
    const aniversarios = loadFromStorage<Aniversario>('aniversarios');
    const nextId = aniversarios.length > 0 ? Math.max(...aniversarios.map(a => a.id)) + 1 : 1;
    
    const novoAniversario: Aniversario = {
      ...data,
      id: nextId,
      created_at: new Date().toISOString(),
    };
    
    aniversarios.push(novoAniversario);
    saveToStorage('aniversarios', aniversarios);
    try { window.dispatchEvent(new CustomEvent('aniversariosUpdated', { detail: { id: novoAniversario.id } })); } catch (e) { }
    
    return novoAniversario;
  },

  update: (id: number, data: Partial<Omit<Aniversario, 'id'>>): Aniversario | null => {
    const aniversarios = loadFromStorage<Aniversario>('aniversarios');
    const index = aniversarios.findIndex(a => a.id === id);
    
    if (index === -1) return null;
    
    aniversarios[index] = { ...aniversarios[index], ...data };
    saveToStorage('aniversarios', aniversarios);
    try { window.dispatchEvent(new CustomEvent('aniversariosUpdated', { detail: { id } })); } catch (e) { }
    
    return aniversarios[index];
  },

  delete: (id: number): boolean => {
    const aniversarios = loadFromStorage<Aniversario>('aniversarios');
    const filtered = aniversarios.filter(a => a.id !== id);
    
    if (filtered.length === aniversarios.length) return false;
    
    saveToStorage('aniversarios', filtered);
    try { window.dispatchEvent(new CustomEvent('aniversariosUpdated', { detail: {} })); } catch (e) { }
    return true;
  },
};
