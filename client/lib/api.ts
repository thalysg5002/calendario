import type { AtualizarEventoDTO, CriarEventoDTO, Evento, Igreja, LoginRequisicao, LoginResposta, Recurso, Usuario, AniversarianteDoDia, AniversarianteOcorrencia, Aniversario, CriarAniversarioDTO } from "@shared/api";
import { igrejasAPI, eventosAPI, aniversariosAPI } from './storage-api';

// Funções auxiliares para converter IDs
const toNumber = (id: string | number): number => typeof id === 'string' ? parseInt(id) : id;

export const api = {
  // === IGREJAS ===
  listarIgrejas: async () => {
    const igs = igrejasAPI.getAll();
    // normalizar campos ausentes para evitar problemas na UI
    return igs.map(i => ({
      ...i,
      codigoCor: (i as any).codigoCor || '#16a34a',
      departamentos: (i as any).departamentos || [],
      orgaos: (i as any).orgaos || [],
    } as any));
  },
  
  criarIgreja: async (dados: { nome: string; endereco?: string | null; codigoCor?: string | null; orgaos?: string[] }) => {
    return igrejasAPI.create({
      nome: dados.nome,
      endereco: dados.endereco || '',
      presidente: '', // campos obrigatórios vazios
      coordenador_area: '',
      coordenadora_ir: '',
      codigoCor: dados.codigoCor || '#16a34a',
      orgaos: dados.orgaos || [],
    } as any);
  },
  
  atualizarIgreja: async (id: string, dados: { nome?: string; endereco?: string | null; codigoCor?: string | null; orgaos?: string[] }) => {
    const result = igrejasAPI.update(toNumber(id), dados);
    if (!result) throw new Error('Igreja não encontrada');
    return result;
  },
  
  removerIgreja: async (id: string) => {
    const success = igrejasAPI.delete(toNumber(id));
    if (!success) throw new Error('Igreja não encontrada');
  },
  
  listarRecursos: async () => [] as Recurso[],
  
  listarUsuarios: async () => [] as Usuario[],
  criarUsuario: async (dados: any) => ({} as Usuario),
  removerUsuario: async (id: string) => {},

  // === EVENTOS ===
  listarEventos: async (inicio?: string, fim?: string) => {
    let eventos = eventosAPI.getAll();

    if (inicio && fim) {
      eventos = eventos.filter(e => {
        const dataInicio = new Date(e.data_inicio);
        const dataFim = new Date(e.data_fim);
        const filtroInicio = new Date(inicio);
        const filtroFim = new Date(fim);

        return dataInicio <= filtroFim && dataFim >= filtroInicio;
      });
    }

    // Mapear campos do storage para o formato esperado pelos componentes
    return eventos.map(e => {
      const igreja = igrejasAPI.getById((e as any).igreja_id ?? (e as any).igrejaId);
      return ({
        ...e,
        // compatibilidade: componentes antigos esperam `dataHoraInicio` / `dataHoraFim` / `igrejaId`
        dataHoraInicio: e.data_inicio,
        dataHoraFim: e.data_fim,
        igrejaId: (e as any).igreja_id ?? (e as any).igrejaId,
        // incluir cor no próprio evento se estiver disponível, senão usar a cor da igreja
        codigoCor: (e as any).codigoCor ?? igreja?.codigoCor ?? '#16a34a',
      } as any);
    });
  },
  
  criarEvento: async (dados: CriarEventoDTO) => {
    // aceitar tanto `dataInicio` quanto `dataHoraInicio` (componentes usam esse campo)
    const inicio = (dados as any).dataInicio || (dados as any).dataHoraInicio || undefined;
    const fim = (dados as any).dataFim || (dados as any).dataHoraFim || undefined;

    const criado = eventosAPI.create({
      titulo: (dados as any).titulo,
      descricao: (dados as any).descricao || '',
      data_inicio: inicio,
      data_fim: fim,
      igreja_id: toNumber((dados as any).igrejaId || (dados as any).igreja_id),
      responsavel: (dados as any).responsavel || '',
      recursoId: (dados as any).recursoId || (dados as any).recurso_id || null,
      diaInteiro: Boolean((dados as any).diaInteiro),
      departamentoId: (dados as any).departamentoId || null,
      orgaoId: (dados as any).orgaoId || null,
    });

    // retornar na forma esperada pelos componentes e anexar a cor da igreja
    const igreja = igrejasAPI.getById((criado as any).igreja_id);
    return {
      ...criado,
      dataHoraInicio: (criado as any).data_inicio,
      dataHoraFim: (criado as any).data_fim,
      igrejaId: (criado as any).igreja_id,
      codigoCor: igreja?.codigoCor || (criado as any).codigoCor || '#16a34a',
    } as any;
  },
  
  atualizarEvento: async (id: string, dados: AtualizarEventoDTO) => {
    const updateData: any = {};
    if (dados.titulo) updateData.titulo = dados.titulo;
    if (dados.descricao) updateData.descricao = dados.descricao;
    // aceitar ambos os formatos
    if ((dados as any).dataInicio) updateData.data_inicio = (dados as any).dataInicio;
    if ((dados as any).dataHoraInicio) updateData.data_inicio = (dados as any).dataHoraInicio;
    if ((dados as any).dataFim) updateData.data_fim = (dados as any).dataFim;
    if ((dados as any).dataHoraFim) updateData.data_fim = (dados as any).dataHoraFim;
    if ((dados as any).igrejaId) updateData.igreja_id = toNumber((dados as any).igrejaId);
    if ((dados as any).igreja_id) updateData.igreja_id = toNumber((dados as any).igreja_id);
    if ((dados as any).responsavel) updateData.responsavel = (dados as any).responsavel;
    if ((dados as any).recursoId) updateData.recursoId = (dados as any).recursoId;
    if ((dados as any).diaInteiro !== undefined) updateData.diaInteiro = Boolean((dados as any).diaInteiro);
    if ((dados as any).departamentoId) updateData.departamentoId = (dados as any).departamentoId;
    if ((dados as any).orgaoId) updateData.orgaoId = (dados as any).orgaoId;
    
    const result = eventosAPI.update(toNumber(id), updateData);
    if (!result) throw new Error('Evento não encontrado');
    const igreja = igrejasAPI.getById((result as any).igreja_id);
    return {
      ...result,
      dataHoraInicio: (result as any).data_inicio,
      dataHoraFim: (result as any).data_fim,
      igrejaId: (result as any).igreja_id,
      codigoCor: igreja?.codigoCor || (result as any).codigoCor || '#16a34a',
    } as any;
  },
  
  removerEvento: async (id: string) => {
    const success = eventosAPI.delete(toNumber(id));
    if (!success) throw new Error('Evento não encontrado');
  },

  aniversariantes: async (dia?: number, mes?: number) => [] as AniversarianteDoDia[],
  aniversariantesMes: async (mes: number) => {
    const aniversarios = aniversariosAPI.getByMes(mes);
    return aniversarios.map(a => ({
      id: a.id.toString(),
      nome: a.nome,
      dataNascimento: a.data_nascimento,
      dia: parseInt(a.data_nascimento.split('-')[2]),
      mes: parseInt(a.data_nascimento.split('-')[1]),
      igreja: { id: a.igreja_id.toString(), nome: '' }, // igreja será preenchida pelo componente
    })) as AniversarianteOcorrencia[];
  },

  // === ANIVERSÁRIOS ===
  listarAniversarios: async () => {
    const raw = aniversariosAPI.getAll();
    return raw.map(a => {
      const data = a.data_nascimento || '';
      const parts = String(data).split('-');
      const ano = parts[0] && parts[0] !== '0000' ? parseInt(parts[0]) : undefined;
      const mes = parts[1] ? parseInt(parts[1]) : undefined;
      const dia = parts[2] ? parseInt(parts[2]) : undefined;
      return {
        ...a,
        dataNascimento: a.data_nascimento,
        dia: dia ?? 0,
        mes: mes ?? 0,
        ano: ano ?? undefined,
        igrejaId: (a as any).igreja_id ?? (a as any).igrejaId ?? 0,
      } as any;
    });
  },
  
  criarAniversario: async (dados: CriarAniversarioDTO) => {
    // aceitar dois formatos: dataNascimento (YYYY-MM-DD) ou dia/mes/ano
    const anyDados = dados as any;
    let dataNascimento = anyDados.dataNascimento;
    if (!dataNascimento && anyDados.dia && anyDados.mes) {
      const ano = anyDados.ano || '0000';
      const mes = String(anyDados.mes).padStart(2, '0');
      const dia = String(anyDados.dia).padStart(2, '0');
      dataNascimento = `${ano}-${mes}-${dia}`;
    }

    return aniversariosAPI.create({
      nome: anyDados.nome,
      data_nascimento: dataNascimento,
      igreja_id: toNumber(anyDados.igrejaId || anyDados.igreja_id || 0),
    });
  },
  
  atualizarAniversario: async (id: string, dados: Partial<CriarAniversarioDTO>) => {
    const updateData: any = {};
    const anyDados = dados as any;
    if (anyDados.nome) updateData.nome = anyDados.nome;
    if (anyDados.dataNascimento) updateData.data_nascimento = anyDados.dataNascimento;
    if (anyDados.dia && anyDados.mes) {
      const ano = anyDados.ano || '0000';
      const mes = String(anyDados.mes).padStart(2, '0');
      const dia = String(anyDados.dia).padStart(2, '0');
      updateData.data_nascimento = `${ano}-${mes}-${dia}`;
    }
    if (anyDados.igrejaId) updateData.igreja_id = toNumber(anyDados.igrejaId);
    if (anyDados.igreja_id) updateData.igreja_id = toNumber(anyDados.igreja_id);
    
    const result = aniversariosAPI.update(toNumber(id), updateData);
    if (!result) throw new Error('Aniversário não encontrado');
    return result;
  },
  
  removerAniversario: async (id: string) => {
    const success = aniversariosAPI.delete(toNumber(id));
    if (!success) throw new Error('Aniversário não encontrado');
  },
  
  aniversariosPorMes: async (mes: number) => {
    const aniversarios = aniversariosAPI.getByMes(mes);
    return aniversarios.map(a => ({
      id: a.id.toString(),
      nome: a.nome,
      dataNascimento: a.data_nascimento,
      dia: parseInt(a.data_nascimento.split('-')[2]),
      mes: parseInt(a.data_nascimento.split('-')[1]),
      igreja: { id: a.igreja_id.toString(), nome: '' },
    })) as AniversarianteOcorrencia[];
  },
};

