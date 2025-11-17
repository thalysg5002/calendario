import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { UserPlus, Calendar, Gift, Trash2, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { AniversarioModal } from "./AniversarioModal";
import { api } from "@/lib/api";
import type { Aniversario } from "@shared/api";

interface AniversariantesListaProps {
  mesAtual?: number;
}

export function AniversariantesLista({ mesAtual }: AniversariantesListaProps) {
  const [aniversarios, setAniversarios] = useState<Aniversario[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [mesDefault, setMesDefault] = useState<number | undefined>(undefined);
  const [aniversarioEdicao, setAniversarioEdicao] = useState<Aniversario | null>(null);
  const { toast } = useToast();

  const carregarAniversarios = async () => {
    try {
      setCarregando(true);
      const dados = await api.listarAniversarios();
      setAniversarios(dados);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar aniversários",
        variant: "destructive",
      });
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarAniversarios();
  }, []);

  useEffect(() => {
    const handler = () => {
      carregarAniversarios();
    };
    try {
      window.addEventListener('aniversariosUpdated', handler as EventListener);
    } catch (e) {}
    return () => {
      try { window.removeEventListener('aniversariosUpdated', handler as EventListener); } catch (e) {}
    };
  }, []);

  const aniversariosDoMes = mesAtual 
    ? aniversarios.filter(a => a.mes === mesAtual)
    : aniversarios;

  const aniversariosOrdenados = aniversariosDoMes.sort((a, b) => {
    if (mesAtual) {
      // Se estamos filtrando por mês, ordenar por dia
      return a.dia - b.dia;
    } else {
      // Caso contrário, ordenar por mês e depois por dia
      if (a.mes !== b.mes) return a.mes - b.mes;
      return a.dia - b.dia;
    }
  });

  const calcularIdade = (ano: number | null | undefined) => {
    if (!ano) return null;
    return new Date().getFullYear() - ano;
  };

  const obterProximoAniversario = (dia: number, mes: number) => {
    const hoje = new Date();
    const anoAtual = hoje.getFullYear();
    const aniversarioEsteAno = new Date(anoAtual, mes - 1, dia);
    
    if (aniversarioEsteAno < hoje) {
      // Aniversário já passou este ano, próximo é no ano que vem
      return new Date(anoAtual + 1, mes - 1, dia);
    } else {
      return aniversarioEsteAno;
    }
  };

  const diasParaAniversario = (dia: number, mes: number) => {
    const proximo = obterProximoAniversario(dia, mes);
    const hoje = new Date();
    const diferenca = proximo.getTime() - hoje.getTime();
    return Math.ceil(diferenca / (1000 * 60 * 60 * 24));
  };

  const removerAniversarioLocal = async (id: string, nome: string) => {
    try {
      await api.removerAniversario(id);
      toast({
        title: "Sucesso",
        description: `Aniversário de ${nome} foi removido`,
      });
      carregarAniversarios();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao remover aniversário",
        variant: "destructive",
      });
    }
  };

  const editarAniversario = (aniversario: Aniversario) => {
    setAniversarioEdicao(aniversario);
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setAniversarioEdicao(null);
  };

  if (carregando) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Aniversariantes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Aniversariantes {mesAtual && `- ${format(new Date(2000, mesAtual - 1), 'MMMM', { locale: ptBR })}`}
            </CardTitle>
            <Button onClick={() => { setMesDefault(mesAtual); setModalAberto(true); }} size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {aniversariosOrdenados.length === 0 ? (
            <div className="text-center py-8">
              <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {mesAtual 
                  ? "Nenhum aniversário neste mês" 
                  : "Nenhum aniversário cadastrado"
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {aniversariosOrdenados.map((aniversario) => {
                const idade = calcularIdade(aniversario.ano);
                const diasRestantes = diasParaAniversario(aniversario.dia, aniversario.mes);
                
                return (
                  <div
                    key={aniversario.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium">{aniversario.nome}</h3>
                        {aniversario.observacoes && (
                          <Badge variant="outline" className="text-xs">
                            {aniversario.observacoes}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {aniversario.dia.toString().padStart(2, '0')}/{aniversario.mes.toString().padStart(2, '0')}
                        </div>
                        
                        {idade !== null && (
                          <span>
                            {idade} anos
                          </span>
                        )}
                        
                        {diasRestantes !== null && (
                          <span className={diasRestantes <= 7 ? "text-orange-600 font-medium" : ""}>
                            {diasRestantes === 0 
                              ? "🎉 Hoje!" 
                              : diasRestantes === 1 
                                ? "Amanhã!" 
                                : `em ${diasRestantes} dias`
                            }
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={() => editarAniversario(aniversario)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          Editar aniversário
                        </TooltipContent>
                      </Tooltip>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover aniversário</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja remover o aniversário de <strong>{aniversario.nome}</strong>? 
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => removerAniversarioLocal(aniversario.id, aniversario.nome)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      
      <AniversarioModal 
        aberto={modalAberto} 
        onFechar={() => { fecharModal(); setMesDefault(undefined); }} 
        onSalvo={carregarAniversarios}
        aniversario={aniversarioEdicao}
        mesDefault={mesDefault}
      />
    </>
  );
}
