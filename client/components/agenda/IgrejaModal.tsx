import { useEffect, useState } from "react";
import type { Igreja } from "@shared/api";
import { api } from "@/lib/api";
import { X, Plus } from "lucide-react";

// Gera uma cor hexadecimal aleatória
function gerarCorAleatoria(): string {
  const letras = '0123456789ABCDEF';
  let cor = '#';
  for (let i = 0; i < 6; i++) {
    cor += letras[Math.floor(Math.random() * 16)];
  }
  return cor;
}

export function IgrejaModal({ 
  aberto, 
  onFechar, 
  onCriada, 
  igreja 
}: { 
  aberto: boolean; 
  onFechar: () => void; 
  onCriada?: (i: Igreja) => void;
  igreja?: Igreja | null;
}) {
  const [nome, setNome] = useState("");
  const [endereco, setEndereco] = useState("");
  const [codigoCor, setCodigoCor] = useState("#16a34a");
  const [orgaos, setOrgaos] = useState<string[]>([]);
  const [novoOrgao, setNovoOrgao] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const eEdicao = Boolean(igreja);

  // Preencher dados quando estiver editando
  useEffect(() => {
    if (aberto) {
      if (igreja) {
        setNome(igreja.nome);
        setEndereco(igreja.endereco || "");
        setCodigoCor(igreja.codigoCor || "#16a34a");
        // igreja.orgaos pode conter objetos ou strings ou até valores nulos — normalizar para array de nomes
        const orgs = (igreja.orgaos || []).map((o: any) => {
          if (!o) return '';
          if (typeof o === 'string') return o;
          return (o && o.nome) ? o.nome : String(o);
        }).filter((s: string) => s && s.trim() !== '');
        setOrgaos(orgs);
      } else {
        setNome("");
        setEndereco("");
        setCodigoCor(gerarCorAleatoria());
        setOrgaos([]);
      }
      setErro(null);
      setNovoOrgao("");
    }
  }, [igreja, aberto]);

  function adicionarOrgao() {
    if (novoOrgao.trim() && !orgaos.includes(novoOrgao.trim())) {
      setOrgaos([...orgaos, novoOrgao.trim()]);
      setNovoOrgao("");
    }
  }

  function removerOrgao(orgao: string) {
    setOrgaos(orgaos.filter(o => o !== orgao));
  }

  function gerarNovaCor() {
    setCodigoCor(gerarCorAleatoria());
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      let resultado: Igreja;
      if (eEdicao && igreja) {
        resultado = await api.atualizarIgreja(igreja.id, { nome, endereco, codigoCor, orgaos });
      } else {
        resultado = await api.criarIgreja({ nome, endereco, codigoCor, orgaos });
      }
      onCriada?.(resultado);
      // Notificar globalmente que as igrejas foram alteradas para atualizar selects em outros modais
      try { window.dispatchEvent(new CustomEvent('igrejas:changed', { detail: resultado })); } catch {}
      onFechar();
      if (!eEdicao) {
        setNome(""); 
        setEndereco("");
        setCodigoCor(gerarCorAleatoria());
        setOrgaos([]);
      }
    } catch (err: any) {
      setErro(err.message || `Erro ao ${eEdicao ? 'atualizar' : 'criar'} igreja`);
    } finally {
      setSalvando(false);
    }
  }

  async function excluir() {
    if (!eEdicao || !igreja) return;
    if (!confirm(`Deseja excluir a igreja "${igreja.nome}"?`)) return;
    
    setSalvando(true);
    setErro(null);
    try {
      await api.removerIgreja(igreja.id);
      onCriada?.(igreja); // Trigger reload
      try { window.dispatchEvent(new CustomEvent('igrejas:changed', { detail: { id: igreja.id, deleted: true } })); } catch {}
      onFechar();
    } catch (err: any) {
      setErro(err.message || "Erro ao excluir igreja");
    } finally {
      setSalvando(false);
    }
  }

  if (!aberto) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 overflow-y-auto">
      <div className="w-full max-w-md rounded-xl bg-card border border-border shadow-2xl my-8">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold">{eEdicao ? "Editar Igreja" : "Nova Igreja"}</h2>
          <button onClick={onFechar} className="rounded-md px-2 py-1 text-sm hover:bg-muted">Fechar</button>
        </div>
        <form onSubmit={salvar} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nome da Igreja *</label>
            <input 
              value={nome} 
              onChange={(e) => setNome(e.target.value)} 
              required 
              placeholder="Ex: Igreja Central"
              className="w-full rounded-md border border-input bg-background px-3 py-2" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Endereço</label>
            <input 
              value={endereco} 
              onChange={(e) => setEndereco(e.target.value)} 
              placeholder="Ex: Rua das Flores, 123"
              className="w-full rounded-md border border-input bg-background px-3 py-2" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Cor da Igreja</label>
            <div className="flex items-center gap-2">
              <input 
                type="color" 
                value={codigoCor} 
                onChange={(e) => setCodigoCor(e.target.value)} 
                className="h-10 w-16 rounded-md border border-input cursor-pointer" 
              />
              <input 
                value={codigoCor} 
                onChange={(e) => setCodigoCor(e.target.value)} 
                className="flex-1 rounded-md border border-input bg-background px-3 py-2" 
              />
              <button
                type="button"
                onClick={gerarNovaCor}
                className="rounded-md px-3 py-2 bg-secondary text-secondary-foreground hover:opacity-90"
                title="Gerar cor aleatória"
              >
                🎲
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Órgãos</label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  value={novoOrgao}
                  onChange={(e) => setNovoOrgao(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), adicionarOrgao())}
                  placeholder="Nome do órgão"
                  className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={adicionarOrgao}
                  className="rounded-md px-3 py-2 bg-primary text-primary-foreground hover:opacity-90 flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar
                </button>
              </div>
              
              {orgaos.length > 0 && (
                <div className="border border-border rounded-md p-2 space-y-1">
                  {orgaos.map((orgao, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-muted px-2 py-1 rounded text-sm">
                      <span>{orgao}</span>
                      <button
                        type="button"
                        onClick={() => removerOrgao(orgao)}
                        className="text-destructive hover:text-destructive/80"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Departamentos fixos serão criados automaticamente
            </p>
          </div>

          {erro && <p className="text-destructive text-sm">{erro}</p>}
          
          <div className="flex items-center justify-between pt-2">
            {eEdicao && (
              <button 
                type="button" 
                onClick={excluir} 
                disabled={salvando}
                className="rounded-md px-3 py-2 bg-destructive text-destructive-foreground hover:opacity-90 disabled:opacity-50"
              >
                Excluir
              </button>
            )}
            <div className="grow" />
            <button 
              type="submit" 
              disabled={salvando} 
              className="rounded-md px-4 py-2 bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 font-medium"
            >
              {salvando ? "Salvando..." : (eEdicao ? "Atualizar" : "Salvar")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
