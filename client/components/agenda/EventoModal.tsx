import { useEffect, useMemo, useState, useRef } from "react";
import type { Evento, Igreja, Recurso, Departamento, Orgao } from "@shared/api";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

export interface EventoModalProps {
  aberto: boolean;
  onFechar: () => void;
  evento?: Evento | null;
  dataInicial?: Date | null;
  onSalvo?: (ev: Evento) => void;
}

export function EventoModal({ aberto, onFechar, evento, dataInicial, onSalvo }: EventoModalProps) {
  const { usuario } = useAuth();
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
    const [responsavel, setResponsavel] = useState("");
  const [inicio, setInicio] = useState<string>("");
  const [fim, setFim] = useState<string>("");
  const [igrejaId, setIgrejaId] = useState<string>(usuario?.igrejaId ?? "");
  const [recursoId, setRecursoId] = useState<string>("");
  const [diaInteiro, setDiaInteiro] = useState(false);
  const [tipoVinculo, setTipoVinculo] = useState<"" | "departamento" | "orgao">("");
  const [departamentoId, setDepartamentoId] = useState<string>("");
  const [orgaoId, setOrgaoId] = useState<string>("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const [igrejas, setIgrejas] = useState<Igreja[]>([]);
  const [recursos, setRecursos] = useState<Recurso[]>([]);

  useEffect(() => {
    // Carregar igrejas e recursos inicialmente
    api.listarIgrejas().then(setIgrejas);
    api.listarRecursos().then(setRecursos);

    // Quando o modal for aberto, recarregar igrejas (caso tenha sido criada uma nova sem reload)
    const onIgrejasChanged = () => api.listarIgrejas().then(setIgrejas);
    window.addEventListener('igrejas:changed', onIgrejasChanged as EventListener);
    return () => window.removeEventListener('igrejas:changed', onIgrejasChanged as EventListener);
  }, []);

  useEffect(() => {
    if (evento) {
      setTitulo(evento.titulo || "");
      setDescricao(evento.descricao || "");
        setResponsavel((evento as any).responsavel || "");
      setInicio((evento as any).dataHoraInicio?.substring(0, 16) || (evento as any).data_inicio?.substring(0,16) || "");
      setFim((evento as any).dataHoraFim?.substring(0, 16) || (evento as any).data_fim?.substring(0,16) || "");
      setIgrejaId(String((evento as any).igrejaId ?? (evento as any).igreja_id ?? ""));
      setRecursoId((evento as any).recursoId || "");
      setDiaInteiro(Boolean((evento as any).diaInteiro));
      
      // Configurar tipo de vínculo e IDs (aceitar snake_case ou camelCase)
      const depId = (evento as any).departamentoId ?? (evento as any).departamento_id ?? null;
      const orgId = (evento as any).orgaoId ?? (evento as any).orgao_id ?? null;
      if (depId) {
        setTipoVinculo("departamento");
        setDepartamentoId(String(depId));
        setOrgaoId("");
      } else if (orgId) {
        setTipoVinculo("orgao");
        setOrgaoId(String(orgId));
        setDepartamentoId("");
      } else {
        // Não zera os campos se já houver valores preenchidos
        setTipoVinculo((prev) => prev || "");
        setDepartamentoId((prev) => prev);
        setOrgaoId((prev) => prev);
      }
    } else {
      const base = dataInicial ?? new Date();
      const a = new Date(base);
      a.setMinutes(0, 0, 0);
      const b = new Date(a);
      b.setHours(a.getHours() + 1);
      setInicio(format(a, "yyyy-MM-dd'T'HH:mm"));
      setFim(format(b, "yyyy-MM-dd'T'HH:mm"));
      setTitulo("");
      setDescricao("");
        setResponsavel("");
        // garantir string
        setIgrejaId(String(usuario?.igrejaId ?? ""));
      setRecursoId("");
      setDiaInteiro(false);
      setTipoVinculo("");
      setDepartamentoId("");
      setOrgaoId("");
    }
    setErro(null);
  }, [evento, dataInicial, usuario?.igrejaId]);

  // Obter igreja selecionada para pegar departamentos e órgãos
  const igrejaSelecionada = useMemo(() => 
    igrejas.find(i => String(i.id) === String(igrejaId)), 
    [igrejas, igrejaId]
  );

  // Limpar seleções quando igreja mudar, mas não ao abrir para edição
  const prevIgrejaId = useRef<string>("");
  useEffect(() => {
    if (prevIgrejaId.current && prevIgrejaId.current !== igrejaId) {
      setTipoVinculo("");
      setDepartamentoId("");
      setOrgaoId("");
    }
    prevIgrejaId.current = igrejaId;
  }, [igrejaId]);

  // Limpar ID quando tipo de vínculo mudar
  useEffect(() => {
    if (tipoVinculo === "departamento") {
      setOrgaoId("");
    } else if (tipoVinculo === "orgao") {
      setDepartamentoId("");
    } else {
      setDepartamentoId("");
      setOrgaoId("");
    }
  }, [tipoVinculo]);

  const podeEditar = true; // Aplicação sem autenticação/roles: permitir edição por padrão

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!podeEditar) return;
    setSalvando(true);
    setErro(null);
    try {
      const dadosEvento = {
        titulo,
        descricao,
          responsavel,
        dataHoraInicio: new Date(inicio).toISOString(),
        dataHoraFim: new Date(fim).toISOString(),
        igrejaId,
        recursoId: recursoId || null,
        diaInteiro,
        departamentoId: tipoVinculo === "departamento" ? departamentoId || null : null,
        orgaoId: tipoVinculo === "orgao" ? orgaoId || null : null,
      };

      if (evento) {
        const atualizado = await api.atualizarEvento(evento.id, dadosEvento);
        onSalvo?.(atualizado);
      } else {
        const criado = await api.criarEvento(dadosEvento);
        onSalvo?.(criado);
      }
      onFechar();
    } catch (err: any) {
      setErro(err.message || "Erro ao salvar");
    } finally {
      setSalvando(false);
    }
  }

  async function excluirAtual() {
    if (!evento) return;
    if (!confirm("Deseja excluir este evento?")) return;
    try {
      await api.removerEvento(evento.id);
      onSalvo?.({ ...evento, titulo: "" } as any);
      onFechar();
    } catch (err: any) {
      setErro(err.message || "Erro ao excluir");
    }
  }

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-3">
      <div className="w-full max-w-lg rounded-xl bg-card border border-border shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold">{evento ? "Editar Evento" : "Novo Evento"}</h2>
          <button onClick={onFechar} className="rounded-md px-2 py-1 text-sm hover:bg-muted">Fechar</button>
        </div>
        <form onSubmit={salvar} className="p-4 space-y-3">
          <div>
            <label className="block text-sm mb-1">Título</label>
            <input value={titulo} onChange={(e) => setTitulo(e.target.value)} required className="w-full rounded-md border border-input bg-background px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">Descrição</label>
            <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2" />
          </div>
            <div>
              <label className="block text-sm mb-1">Responsável</label>
              <input value={responsavel} onChange={(e) => setResponsavel(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2" placeholder="Nome do responsável" />
            </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Início</label>
              <input type="datetime-local" value={inicio} onChange={(e) => setInicio(e.target.value)} required className="w-full rounded-md border border-input bg-background px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm mb-1">Fim</label>
              <input type="datetime-local" value={fim} onChange={(e) => setFim(e.target.value)} required className="w-full rounded-md border border-input bg-background px-3 py-2" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Igreja</label>
              <select value={igrejaId} onChange={(e) => setIgrejaId(e.target.value)} required className="w-full rounded-md border border-input bg-background px-3 py-2">
                <option value="" disabled>Selecione</option>
                {igrejas.map((i) => (<option key={i.id} value={String(i.id)}>{i.nome}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Recurso</label>
              <select value={recursoId} onChange={(e) => setRecursoId(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2">
                <option value="">Sem recurso / Espaço principal</option>
                <option value="nave-do-templo">Nave do templo</option>
                <option value="anexo">Anexo</option>
                <option value="departamento">Departamento</option>
                <option value="andar-superior">Andar superior</option>
                <option value="estacionamento">Estacionamento</option>
                <option value="outro">Outro</option>
              </select>
            </div>
          </div>

          {/* Vinculação com Departamento ou Órgão */}
          {igrejaSelecionada && (igrejaSelecionada.departamentos?.length || igrejaSelecionada.orgaos?.length) ? (
            <div className="border border-border rounded-lg p-3 space-y-3 bg-muted/30">
              <label className="block text-sm font-medium">Vincular a (Opcional)</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs mb-1">Tipo</label>
                  <select 
                    value={tipoVinculo} 
                    onChange={(e) => setTipoVinculo(e.target.value as "" | "departamento" | "orgao")} 
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Nenhum</option>
                    {igrejaSelecionada.departamentos?.length ? <option value="departamento">Departamento</option> : null}
                    {igrejaSelecionada.orgaos?.length ? <option value="orgao">Órgão</option> : null}
                  </select>
                </div>
                
                {tipoVinculo === "departamento" && igrejaSelecionada.departamentos && (
                  <div>
                    <label className="block text-xs mb-1">Departamento</label>
                    <select 
                      value={departamentoId} 
                      onChange={(e) => setDepartamentoId(e.target.value)} 
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Selecione...</option>
                      {igrejaSelecionada.departamentos.map((dep) => (
                        <option key={dep.id} value={String(dep.id)}>{dep.nome}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                {tipoVinculo === "orgao" && igrejaSelecionada.orgaos && (
                  <div>
                    <label className="block text-xs mb-1">Órgão</label>
                    <select 
                      value={orgaoId} 
                      onChange={(e) => setOrgaoId(e.target.value)} 
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Selecione...</option>
                      {igrejaSelecionada.orgaos.map((org) => (
                        <option key={org.id} value={String(org.id)}>{org.nome}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={diaInteiro} onChange={(e) => setDiaInteiro(e.target.checked)} /> Dia inteiro
          </label>
          {erro && <p className="text-destructive text-sm">{erro}</p>}
          <div className="flex items-center justify-between pt-2">
            {evento && podeEditar && <button type="button" onClick={excluirAtual} className="rounded-md px-3 py-2 bg-destructive text-destructive-foreground hover:opacity-90">Excluir</button>}
            <div className="grow" />
            <button disabled={!podeEditar} className="rounded-md px-3 py-2 bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
