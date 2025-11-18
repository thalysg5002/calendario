import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { api } from "@/lib/api";
import type { Igreja, Evento, AniversarianteOcorrencia } from "@shared/api";
import type { Aniversario } from "@shared/api";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Download } from "lucide-react";

interface ExportarCalendarioPDFProps {
  aberto: boolean;
  onFechar: () => void;
  igrejas: Igreja[];
}

type TipoExportacao = "mensal" | "anual" | "periodo";
// Removido: type FormatoExportacao

type RGB = [number, number, number];

function parseCssHslTriplet(value: string | null): { h: number; s: number; l: number } | null {
  if (!value) return null;
  // expected like: "18 55% 44%"
  const parts = value
    .trim()
    .replace(/\s+/g, " ")
    .split(" ");
  if (parts.length < 3) return null;
  const h = Number(parts[0]);
  const s = Number(parts[1].replace("%", ""));
  const l = Number(parts[2].replace("%", ""));
  if ([h, s, l].some((n) => Number.isNaN(n))) return null;
  return { h, s, l };
}

function hslToRgb(h: number, s: number, l: number): RGB {
  // h in [0..360], s/l in [0..100]
  const H = (h % 360) / 360;
  const S = Math.max(0, Math.min(1, s / 100));
  const L = Math.max(0, Math.min(1, l / 100));
  const q = L < 0.5 ? L * (1 + S) : L + S - L * S;
  const p = 2 * L - q;
  const toRgb = (t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const r = Math.round(toRgb(H + 1 / 3) * 255);
  const g = Math.round(toRgb(H) * 255);
  const b = Math.round(toRgb(H - 1 / 3) * 255);
  return [r, g, b];
}

function weekdayShort(date: Date | number) {
  const map = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
  const d = (typeof date === 'number') ? new Date(date) : date;
  const wd = d.getDay();
  return map[wd] || '';
}

function getThemeColors(): {
  primary: RGB;
  primaryFg: RGB;
  accent: RGB;
  accentFg: RGB;
  foreground: RGB;
  muted: RGB;
  border: RGB;
  card: RGB;
} {
  try {
    const css = getComputedStyle(document.documentElement);
    const p = parseCssHslTriplet(css.getPropertyValue("--primary"));
    const pf = parseCssHslTriplet(css.getPropertyValue("--primary-foreground"));
    const a = parseCssHslTriplet(css.getPropertyValue("--accent"));
    const af = parseCssHslTriplet(css.getPropertyValue("--accent-foreground"));
    const fg = parseCssHslTriplet(css.getPropertyValue("--foreground"));
    const mu = parseCssHslTriplet(css.getPropertyValue("--muted"));
    const bd = parseCssHslTriplet(css.getPropertyValue("--border"));
    const cd = parseCssHslTriplet(css.getPropertyValue("--card"));
    return {
      primary: p ? hslToRgb(p.h, p.s, p.l) : [102, 126, 234],
      primaryFg: pf ? hslToRgb(pf.h, pf.s, pf.l) : [255, 255, 255],
      accent: a ? hslToRgb(a.h, a.s, a.l) : [249, 115, 22],
      accentFg: af ? hslToRgb(af.h, af.s, af.l) : [255, 255, 255],
      foreground: fg ? hslToRgb(fg.h, fg.s, fg.l) : [31, 41, 55],
      muted: mu ? hslToRgb(mu.h, mu.s, mu.l) : [243, 244, 246],
      border: bd ? hslToRgb(bd.h, bd.s, bd.l) : [229, 231, 235],
      card: cd ? hslToRgb(cd.h, cd.s, cd.l) : [255, 255, 255],
    };
  } catch (error) {
    console.warn('getThemeColors fallback:', error);
    return {
      primary: [102, 126, 234],
      primaryFg: [255, 255, 255],
      accent: [249, 115, 22],
      accentFg: [255, 255, 255],
      foreground: [31, 41, 55],
      muted: [243, 244, 246],
      border: [229, 231, 235],
      card: [255, 255, 255],
    };
  }
}


function drawAppHeaderPDF(
  doc: any,
  pageWidth: number,
  cores: ReturnType<typeof getThemeColors>,
  titulo: string,
  _filtros: { igrejas: string[]; departamentos: string[]; orgaos: string[] },
  logoDataUrl?: string,
) {
  const headerH = 38;
  const left = 14;
  const top = 8;
  doc.setFillColor(cores.card[0], cores.card[1], cores.card[2]);
  doc.rect(0, 0, pageWidth, headerH + 4, "F");
  doc.setDrawColor(cores.border[0], cores.border[1], cores.border[2]);
  doc.line(0, headerH + 4, pageWidth, headerH + 4);

  // Não desenha logo (evita fetch async)
  // Desenha logo se disponível
  if (logoDataUrl) {
    try { doc.addImage(logoDataUrl, 'PNG', left, top, 26, 26); } catch {}
  }
  const xText = left + 30;
  let y = top + 6;
  doc.setTextColor(cores.primary[0], cores.primary[1], cores.primary[2]);
  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.text("IGREJA EVANGÉLICA ASSEMBLEIA DE DEUS", xText, y);
  doc.setFont(undefined, "normal");
  doc.setTextColor(60, 64, 67);
  doc.setFontSize(8.5);
  y += 6;
  doc.text("Rua: Jose Alencar, 17, Vila Torres Galvão, Paulista/PE - CEP: 53403-780", xText, y);
  y += 5;
  doc.text("Presidente PR. Roberto José Dos Santos Lucena", xText, y);
  y += 5;
  doc.text("Coordenador Da Área PR. Gilmar Ribeiro", xText, y);
  y += 5;
  doc.text("Coordenadora Da Área IR. Benezoete Ribeiro", xText, y);

  doc.setFontSize(16);
  doc.setTextColor(cores.foreground[0], cores.foreground[1], cores.foreground[2]);
  doc.setFont(undefined, "bold");
  doc.text(titulo, pageWidth / 2, headerH + 13, { align: "center" });
}

export function ExportarCalendarioPDF({ aberto, onFechar, igrejas }: ExportarCalendarioPDFProps) {
  const [tipo, setTipo] = useState<TipoExportacao>("mensal");
  // Removido: formato, setFormato
 // Removido: formato, setFormato
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [periodoInicio, setPeriodoInicio] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [periodoFim, setPeriodoFim] = useState<string>(format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [igrejasFiltradas, setIgrejasFiltradas] = useState<string[]>([]);
  const [departamentosFiltrados, setDepartamentosFiltrados] = useState<string[]>([]);
  const [orgaosFiltrados, setOrgaosFiltrados] = useState<string[]>([]);
  // 0 = só eventos, 1 = só aniversários, 2 = ambos
  const [tipoExportacao, setTipoExportacao] = useState<0 | 1 | 2>(0);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    setIgrejasFiltradas([]);
    setDepartamentosFiltrados([]);
    setOrgaosFiltrados([]);
  }, [tipo]);

  const departamentosDisponiveis = igrejas
    .filter((i) => igrejasFiltradas.length === 0 || igrejasFiltradas.includes(String(i.id)))
    .flatMap((i) => (i.departamentos || []).map((d) => ({ ...d, igrejaId: i.id, igrejaNome: i.nome })));

  const orgaosDisponiveis = igrejas
    .filter((i) => igrejasFiltradas.length === 0 || igrejasFiltradas.includes(String(i.id)))
    .flatMap((i) => (i.orgaos || []).map((o) => ({ ...o, igrejaId: i.id, igrejaNome: i.nome })));

  async function gerarPDF() {
    setCarregando(true);
    try {
      // Usar sempre período explicitado (data inicial / data final)
      const inicio = startOfDay(new Date(periodoInicio));
      const fim = endOfDay(new Date(periodoFim));

      let eventos: Evento[] = [];
      if (tipoExportacao !== 1) {
        eventos = await api.listarEventos(inicio.toISOString(), fim.toISOString());
        if (igrejasFiltradas.length > 0) eventos = eventos.filter((e) => igrejasFiltradas.includes(String((e as any).igrejaId ?? (e as any).igreja_id)));
        if (departamentosFiltrados.length > 0) eventos = eventos.filter((e) => (e as any).departamentoId && departamentosFiltrados.includes(String((e as any).departamentoId)));
        if (orgaosFiltrados.length > 0) eventos = eventos.filter((e) => (e as any).orgaoId && orgaosFiltrados.includes(String((e as any).orgaoId)));
      }

      let aniversarios: Aniversario[] = [];
      if (tipoExportacao !== 0) {
        let aniversariosCompletos = await api.listarAniversarios();
        if (tipo === "mensal") {
          aniversariosCompletos = aniversariosCompletos.filter(a => a.mes === mes);
        }
        if (igrejasFiltradas.length > 0) aniversariosCompletos = aniversariosCompletos.filter((a) => igrejasFiltradas.includes(String((a as any).igrejaId ?? (a as any).igreja_id)));
        if (departamentosFiltrados.length > 0) aniversariosCompletos = aniversariosCompletos.filter((a) => (a as any).departamentoId && departamentosFiltrados.includes(String((a as any).departamentoId)));
        if (orgaosFiltrados.length > 0) aniversariosCompletos = aniversariosCompletos.filter((a) => (a as any).orgaoId && orgaosFiltrados.includes(String((a as any).orgaoId)));
        aniversarios = aniversariosCompletos;
      }

      const { default: jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default as any;
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true
      });
      
      try {
        doc.setFont("helvetica");
      } catch (error) {
        console.warn('Fonte não disponível:', error);
      }
      
      const pageWidth = doc.internal.pageSize.width;

      const cores = getThemeColors();
      // Forçar paleta do PDF para tons de verde (escuro = primary, claro = accent)
      const pdfPalette = {
        primary: [15, 81, 50], // verde escuro
        primaryFg: [255, 255, 255],
        accent: [167, 227, 167], // verde claro
        accentFg: [20, 40, 20],
        muted: [240, 250, 240],
        border: [200, 230, 200],
        card: [255, 255, 255],
      } as const;

      const coresPdf = {
        ...cores,
        primary: pdfPalette.primary,
        primaryFg: pdfPalette.primaryFg,
        accent: pdfPalette.accent,
        accentFg: pdfPalette.accentFg,
        muted: pdfPalette.muted,
        border: pdfPalette.border,
        card: pdfPalette.card,
      } as ReturnType<typeof getThemeColors>;
      const titulo = tipo === "mensal" ? `Agenda ${format(new Date(ano, mes - 1, 1), "MMMM 'de' yyyy", { locale: ptBR })}` : `Agenda Anual ${ano}`;

      // Carrega logo como base64 para uso síncrono
      let logoDataUrl = '';
      try {
        const blob = await fetch('/logo-igreja.png').then(r => r.blob());
        logoDataUrl = await new Promise<string>((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result as string); fr.readAsDataURL(blob); });
      } catch {}
      const nomeArquivo = `calendario_periodo_${periodoInicio}_a_${periodoFim}.pdf`;
      // Gera PDF com cabeçalho (inclui logo base64)
      gerarPDFListaLocal(
        doc,
        autoTable,
        eventos,
        aniversarios,
        tipo,
        mes,
        ano,
        igrejas,
        coresPdf,
        titulo,
        igrejasFiltradas,
        departamentosFiltrados,
        orgaosFiltrados,
        logoDataUrl,
      );
      doc.save(nomeArquivo);
      onFechar();
    } catch (erro: any) {
      alert("Erro ao gerar PDF: " + erro.message);
    } finally {
      setCarregando(false);
    }
  }

  function gerarPDFListaLocal(
    doc: any,
    autoTable: any,
    eventos: Evento[],
    aniversarios: Aniversario[],
    tipo: TipoExportacao,
    mes: number,
    ano: number,
    igrejas: Igreja[],
    cores: ReturnType<typeof getThemeColors>,
    titulo: string,
    igrejasFiltradas: string[],
    departamentosFiltrados: string[],
    orgaosFiltrados: string[],
    logoDataUrl?: string,
  ) {
    const pageWidth = doc.internal.pageSize.width;
    let yPos = 58;

    if (eventos.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(cores.primary[0], cores.primary[1], cores.primary[2]);
      doc.text("Eventos", 14, yPos);
      yPos += 6;

        const dadosEventos = eventos.map((e) => {
        const igreja = igrejas.find((i) => String(i.id) === String((e as any).igrejaId ?? (e as any).igreja_id));
        const dep = (e as any).departamentoId && igreja?.departamentos?.find((d) => String(d.id) === String((e as any).departamentoId));
        const org = (e as any).orgaoId && igreja?.orgaos?.find((o) => String(o.id) === String((e as any).orgaoId));
        const inicioDate = new Date((e as any).dataHoraInicio || (e as any).data_inicio);
        const fimDate = new Date((e as any).dataHoraFim || (e as any).data_fim);
        const dateDisplay = isNaN(inicioDate.getTime()) ? '' : `${weekdayShort(inicioDate)} ${format(inicioDate, "dd/MM/yyyy", { locale: ptBR })}`;
        return [
          dateDisplay,
          (e as any).diaInteiro ? "Dia inteiro" : `${isNaN(inicioDate.getTime()) ? '' : format(inicioDate, "HH:mm")} - ${isNaN(fimDate.getTime()) ? '' : format(fimDate, "HH:mm")}`,
          e.titulo,
          igreja?.nome || "",
          dep?.nome || org?.nome || "-",
          (e as any).responsavel || "-",
        ];
      });

      autoTable(doc, {
        startY: yPos,
        head: [["Data", "Horário", "Título", "Igreja", "Dept/Órgão", "Responsável"]],
        body: dadosEventos,
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: cores.primary, textColor: cores.primaryFg },
        alternateRowStyles: { fillColor: cores.muted },
        margin: { left: 14, right: 14, top: 58 },
        didDrawPage: (data) => {
          // Cabeçalho institucional e título centralizados em todas as páginas
          drawAppHeaderPDF(
            doc,
            doc.internal.pageSize.width,
            cores,
            titulo,
            {
              igrejas: igrejasFiltradas,
              departamentos: departamentosFiltrados,
              orgaos: orgaosFiltrados,
            },
            logoDataUrl,
          );
        }
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    if (aniversarios.length > 0) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(14);
      doc.setTextColor(cores.accent[0], cores.accent[1], cores.accent[2]);
      doc.text("Aniversários", 14, yPos);
      yPos += 6;

      // Função para calcular idade
      const calcularIdade = (ano?: number | null) => {
        if (!ano) return "-";
        const hoje = new Date();
        return (hoje.getFullYear() - ano).toString();
      };

        const dadosAniversarios = aniversarios
        .sort((a, b) => (a.mes !== b.mes ? a.mes - b.mes : a.dia - b.dia))
        .map((a) => {
          const igreja = igrejas.find((i) => String(i.id) === String((a as any).igrejaId ?? (a as any).igreja_id));
          // calcular próximo aniversário para obter dia da semana
          let dateStr = '';
          try {
            if (a.dia && a.mes) {
              const hoje = new Date();
              let anoRef = hoje.getFullYear();
              let dt = new Date(anoRef, a.mes - 1, a.dia);
              if (dt < hoje) dt = new Date(anoRef + 1, a.mes - 1, a.dia);
              dateStr = `${weekdayShort(dt)} ${String(a.dia).padStart(2, "0")}/${String(a.mes).padStart(2, "0")}`;
            }
          } catch (e) { dateStr = `${String(a.dia).padStart(2, "0")}/${String(a.mes).padStart(2, "0")}`; }

          return [
            dateStr || `${String(a.dia).padStart(2, "0")}/${String(a.mes).padStart(2, "0")}`,
            a.nome,
            igreja?.nome || "-",
            a.ano ? calcularIdade(a.ano) : "-",
            a.observacoes || "-"
          ];
        });

      autoTable(doc, {
        startY: yPos,
        head: [["Data", "Nome", "Igreja", "Idade", "Observações"]],
        body: dadosAniversarios,
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: cores.accent, textColor: cores.accentFg },
        alternateRowStyles: { fillColor: cores.muted },
        margin: { left: 14, right: 14, top: 58 },
        didDrawPage: (data) => {
          // Cabeçalho institucional e título centralizados em todas as páginas
          drawAppHeaderPDF(
            doc,
            doc.internal.pageSize.width,
            cores,
            titulo,
            {
              igrejas: igrejasFiltradas,
              departamentos: departamentosFiltrados,
              orgaos: orgaosFiltrados,
            },
            logoDataUrl,
          );
        }
      });
    }

    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      const rodape = `Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`;
      doc.text(
        rodape,
        pageWidth / 2,
        doc.internal.pageSize.height - 10,
        { align: "center" }
      );
    }
  }

  function gerarPDFCalendarioLocal(
  // Função de calendário removida
    doc: any,
    eventos: Evento[],
    aniversarios: AniversarianteOcorrencia[],
    tipo: TipoExportacao,
    mes: number,
    ano: number,
    igrejas: Igreja[],
    cores: ReturnType<typeof getThemeColors>,
  ) {
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    doc.setFontSize(9);
    doc.setTextColor(75, 85, 99);
    const resumoY = 54;

    if (tipo === "mensal") {
      const left = 14;
      const top = resumoY + 15;
      const gridWidth = pageWidth - left * 2;
      const gridHeight = pageHeight - top - 18;
      const cols = 7;
      const rows = 6;
      const cellW = gridWidth / cols;
      const cellH = gridHeight / rows;

      // nomes da semana (antes do calendário) com fundo
      const nomes = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const headerHeight = 7;
  const headerGap = 2; // pequeno espaço entre o fundo dos nomes e as células
  const headerY = top - headerHeight - headerGap;
      // fundo leve atrás dos nomes
      doc.setFillColor(cores.muted[0], cores.muted[1], cores.muted[2]);
      doc.setDrawColor(cores.border[0], cores.border[1], cores.border[2]);
      doc.roundedRect(left, headerY, gridWidth, headerHeight, 4, 4, 'F');

      doc.setFontSize(9);
      doc.setFont(undefined, "bold");
      doc.setTextColor(cores.primary[0], cores.primary[1], cores.primary[2]);
      const nomesY = headerY + headerHeight / 2 + 2;
      for (let i = 0; i < cols; i++) {
        const x = left + i * cellW + cellW / 2;
        doc.text(nomes[i], x, nomesY, { align: "center" });
      }
      doc.setFont(undefined, "normal");

      const primeiroDia = new Date(ano, mes - 1, 1);
      const ultimoDia = new Date(ano, mes, 0);
      const diasNoMes = ultimoDia.getDate();
      const primeiroDiaSemana = primeiroDia.getDay();
      const diasMesAnterior = new Date(ano, mes - 1, 0).getDate();

      doc.setDrawColor(cores.border[0], cores.border[1], cores.border[2]);

      let diaAtual = 1;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = left + c * cellW;
          const y = top + r * cellH;
          const posicao = r * 7 + c;
          const isEmpty = posicao < primeiroDiaSemana || diaAtual > diasNoMes;
          
          doc.roundedRect(x, y, cellW - 1.5, cellH - 1.5, 3, 3);
          
          if (isEmpty) {
            // Dias do mês anterior ou próximo mês
            let dayNum = 0;
            if (posicao < primeiroDiaSemana) {
              dayNum = diasMesAnterior - primeiroDiaSemana + c + 1;
            } else {
              dayNum = posicao - primeiroDiaSemana - diasNoMes + 1;
            }
            doc.setFontSize(10);
            doc.setTextColor(170, 170, 170);
            doc.text(String(dayNum), x + cellW - 12, y + 8, { align: "right" });
          } else {
            // número do dia
            doc.setFontSize(10);
            doc.setTextColor(60, 64, 67);
            doc.text(String(diaAtual), x + cellW - 12, y + 8, { align: "right" });

            // Filtrar eventos que iniciam neste dia
            const eventosIniciamHoje = eventos.filter((e) => {
              const d = new Date(e.dataHoraInicio);
              return d.getDate() === diaAtual && d.getMonth() === mes - 1 && d.getFullYear() === ano;
            });
            const aniversariosDoDia = aniversarios.filter((a) => a.dia === diaAtual && a.mes === mes);

            // Calcular espaço disponível e ajustar tamanho
            const espacoDisponivel = cellH - 18;
            const totalItens = eventosIniciamHoje.length + aniversariosDoDia.length;
            
            let pillHeight = 6;
            let pillGap = 2;
            let fontSize = 7;
            
            // Calcular quantos cabem com tamanho padrão
            const maxComPadrao = Math.floor(espacoDisponivel / (pillHeight + pillGap));
            
            // Se não cabe, reduzir progressivamente
            if (totalItens > maxComPadrao) {
              if (totalItens <= Math.floor(espacoDisponivel / 6.8)) {
                pillHeight = 5;
                pillGap = 1.8;
                fontSize = 6.5;
              } else if (totalItens <= Math.floor(espacoDisponivel / 6)) {
                pillHeight = 4.5;
                pillGap = 1.5;
                fontSize = 6;
              } else if (totalItens <= Math.floor(espacoDisponivel / 5.2)) {
                pillHeight = 4;
                pillGap = 1.2;
                fontSize = 5.5;
              } else {
                pillHeight = 3.5;
                pillGap = 1;
                fontSize = 5;
              }
            }
            
            const pillSpacing = pillHeight + pillGap;
            let yy = y + 14;
            doc.setFontSize(fontSize);
            
            // Eventos em formato de pill
            eventosIniciamHoje.forEach((e) => {
              const igr = igrejas.find((i) => i.id === e.igrejaId);
              const cor = igr?.codigoCor || "#16a34a";
              const rr = parseInt(cor.slice(1, 3), 16);
              const gg = parseInt(cor.slice(3, 5), 16);
              const bb = parseInt(cor.slice(5, 7), 16);
              
              // Calcular se é multi-dia e quantas células ocupa
              const inicio = new Date(e.dataHoraInicio);
              const fim = new Date(e.dataHoraFim);
              const inicioDia = inicio.getDate();
              const fimDia = fim.getDate();
              const inicioMes = inicio.getMonth();
              const fimMes = fim.getMonth();
              
              let numCells = 1;
              let pillWidth = cellW - 8;
              
              // Se evento é multi-dia e no mesmo mês
              if (inicioDia !== fimDia && inicioMes === fimMes && inicioMes === mes - 1) {
                const diasEvento = fimDia - inicioDia + 1;
                const diaSemanaDia = (primeiroDiaSemana + diaAtual - 1) % 7;
                const diasAteFimSemana = 7 - diaSemanaDia;
                numCells = Math.min(diasEvento, diasAteFimSemana);
                pillWidth = (cellW * numCells) - 8 - ((numCells - 1) * 1.5);
              }
              
              const maxChars = totalItens > 6 ? 13 : (totalItens > 4 ? 16 : 19);
              const titulo = e.titulo.length > maxChars ? e.titulo.slice(0, maxChars - 3) + "…" : e.titulo;
              const pillX = x + 4;
              const pillY = yy - 4;
              
              doc.setFillColor(rr, gg, bb);
              doc.roundedRect(pillX, pillY, pillWidth, pillHeight, 2, 2, "F");
              
              doc.setTextColor(255, 255, 255);
              doc.setFont(undefined, "bold");
              doc.text(titulo, pillX + 2, yy, { maxWidth: pillWidth - 4 });
              doc.setFont(undefined, "normal");
              
              yy += pillSpacing;
            });

            // Aniversários em formato de pill
            aniversariosDoDia.forEach((a) => {
              const maxChars = totalItens > 6 ? 13 : (totalItens > 4 ? 16 : 19);
              const nome = a.nome.length > maxChars ? a.nome.slice(0, maxChars - 3) + "…" : a.nome;
              const pillWidth = cellW - 8;
              const pillX = x + 4;
              const pillY = yy - 4;
              
              doc.setFillColor(249, 115, 22);
              doc.roundedRect(pillX, pillY, pillWidth, pillHeight, 2, 2, "F");
              
              doc.setTextColor(255, 255, 255);
              doc.setFont(undefined, "bold");
              doc.text(`🎂 ${nome}`, pillX + 2, yy, { maxWidth: pillWidth - 4 });
              doc.setFont(undefined, "normal");
              
              yy += pillSpacing;
            });

            diaAtual++;
          }
        }
      }

      // legenda detalhada de eventos (abaixo do calendário)
      let legendY = top + rows * cellH + 10;
      const eventosOrdenados = [...eventos].sort((a, b) => new Date(a.dataHoraInicio).getTime() - new Date(b.dataHoraInicio).getTime());
      if (legendY < pageHeight - 20 && eventosOrdenados.length > 0) {
        doc.setFontSize(12);
        doc.setTextColor(cores.primary[0], cores.primary[1], cores.primary[2]);
  doc.text("Igrejas", left, legendY);
        legendY += 6;
        doc.setFontSize(9);
        eventosOrdenados.forEach((e) => {
          if (legendY > pageHeight - 14) { doc.addPage(); legendY = 20; }
          const igr = igrejas.find((i) => i.id === e.igrejaId);
          const dep = e.departamentoId && igr?.departamentos?.find((d) => d.id === e.departamentoId);
          const org = e.orgaoId && igr?.orgaos?.find((o) => o.id === e.orgaoId);
          const cor = igr?.codigoCor ? igr.codigoCor : undefined;
          const rr = cor ? parseInt(cor.slice(1, 3), 16) : cores.primary[0];
          const gg = cor ? parseInt(cor.slice(3, 5), 16) : cores.primary[1];
          const bb = cor ? parseInt(cor.slice(5, 7), 16) : cores.primary[2];
          doc.setFillColor(rr, gg, bb);
          doc.circle(left + 2, legendY - 1.5, 1.6, "F");
          doc.setTextColor(0, 0, 0);
          const dataStr = e.diaInteiro ? format(new Date(e.dataHoraInicio), "dd/MM", { locale: ptBR }) : format(new Date(e.dataHoraInicio), "dd/MM HH:mm", { locale: ptBR });
          const igrejaStr = igr?.nome ? ` • ${igr.nome}` : "";
          const detalhe = dep ? ` • ${dep.nome}` : (org ? ` • ${org.nome}` : "");
          const linha = `${dataStr} - ${e.titulo}${igrejaStr}${detalhe}`;
          doc.text(linha, left + 6, legendY);
          legendY += 5;
        });
      }
    } else {
      const margin = 12;
      const topGrid = 82;
      const cols = 3;
      const rows = 4;
      const gridW = pageWidth - margin * 2;
      const cellW = gridW / cols;
      const cellH = 58;
      const nomes = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
      doc.setFontSize(9);

      for (let m = 0; m < 12; m++) {
        const col = m % cols;
        const row = Math.floor(m / cols);
        const x0 = margin + col * cellW;
        const y0 = topGrid + row * cellH;
        const tituloMes = format(new Date(ano, m, 1), "MMMM", { locale: ptBR });
        doc.setTextColor(cores.primary[0], cores.primary[1], cores.primary[2]);
        doc.setFont(undefined, "bold");
        doc.text(tituloMes, x0 + cellW / 2, y0 + 4, { align: "center" });
        doc.setFont(undefined, "normal");

        const w = cellW - 4;
        const x = x0 + 2;
        // fundo pequeno atrás dos nomes do mês e pequeno gap para as células
        const headerHMonth = 5;
        const headerGapMonth = 2;
        const headerYMonth = y0 + 4 - headerGapMonth;
        doc.setFillColor(cores.muted[0], cores.muted[1], cores.muted[2]);
        doc.setDrawColor(cores.border[0], cores.border[1], cores.border[2]);
        doc.roundedRect(x, headerYMonth, w, headerHMonth, 2, 2, 'F');

        const nomesMonthY = headerYMonth + headerHMonth / 2 + 2;
        for (let i = 0; i < 7; i++) {
          doc.setTextColor(107, 114, 128);
          doc.text(nomes[i], x + (i + 0.5) * (w / 7), nomesMonthY, { align: "center" });
        }
        // posiciona o início das células logo abaixo do header do mês com pequeno gap
        let y = headerYMonth + headerHMonth + 2;
        const primeiroDia = new Date(ano, m, 1);
        const ultimoDia = new Date(ano, m + 1, 0);
        const diasNoMes = ultimoDia.getDate();
        const primeiroDiaSemana = primeiroDia.getDay();
        const diasMesAnterior = new Date(ano, m, 0).getDate();
        const cw = w / 7;
        const ch = (cellH - 20) / 6;
        let dia = 1;
        for (let r = 0; r < 6; r++) {
          for (let c = 0; c < 7; c++) {
            const xx = x + c * cw;
            const yy = y + r * ch;
            const posicao = r * 7 + c;
            const vazio = posicao < primeiroDiaSemana || dia > diasNoMes;
            
            doc.setDrawColor(240, 241, 243);
            doc.roundedRect(xx, yy, cw - 1.4, ch - 1.4, 2, 2);
            
            if (vazio) {
              // Dias do mês anterior ou próximo mês
              let dayNum = 0;
              if (posicao < primeiroDiaSemana) {
                // Dias do mês anterior
                dayNum = diasMesAnterior - primeiroDiaSemana + c + 1;
              } else {
                // Dias do próximo mês
                dayNum = posicao - primeiroDiaSemana - diasNoMes + 1;
              }
              doc.setFontSize(6.5);
              doc.setTextColor(200, 202, 205);
              doc.text(String(dayNum), xx + cw - 4, yy + 6, { align: "right" });
            } else {
              doc.setFontSize(6.5);
              doc.setTextColor(120, 124, 130);
              doc.text(String(dia), xx + cw - 4, yy + 6, { align: "right" });
              const doDia = eventos.filter((e) => {
                const d = new Date(e.dataHoraInicio);
                return d.getDate() === dia && d.getMonth() === m && d.getFullYear() === ano;
              });
              const bds = aniversarios.filter((a) => a.mes === m + 1 && a.dia === dia);
              let sy = yy + 8;
              doDia.slice(0, 2).forEach((e) => {
                const igr = igrejas.find((i) => i.id === e.igrejaId);
                const cor = igr?.codigoCor ? igr.codigoCor : undefined;
                const rr = cor ? parseInt(cor.slice(1, 3), 16) : cores.primary[0];
                const gg = cor ? parseInt(cor.slice(3, 5), 16) : cores.primary[1];
                const bb = cor ? parseInt(cor.slice(5, 7), 16) : cores.primary[2];
                doc.setFillColor(rr, gg, bb);
                doc.circle(xx + 3, sy - 1.5, 0.9, "F");
                sy += 3.3;
              });
              if (bds.length > 0) {
                doc.setFillColor(cores.accent[0], cores.accent[1], cores.accent[2]);
                doc.circle(xx + 3, sy - 1.5, 0.9, "F");
              }
              dia++;
            }
          }
        }
      }
    }

    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      const rodape = `Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`;
      doc.text(
        rodape,
        pageWidth / 2,
        doc.internal.pageSize.height - 10,
        { align: "center" }
      );
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={onFechar}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Exportar Calendário em PDF
          </DialogTitle>
          <DialogDescription>
            Geração de PDFs do calendário de eventos e aniversariantes. Escolha o período e os filtros desejados, e clique em "Gerar PDF" para baixar o arquivo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label className="text-sm sm:text-base font-semibold">Período</Label>
            <RadioGroup value={tipo} onValueChange={(v) => setTipo(v as TipoExportacao)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="mensal" id="mensal" />
                <Label htmlFor="mensal" className="cursor-pointer">Mensal</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="anual" id="anual" />
                <Label htmlFor="anual" className="cursor-pointer">Anual</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="periodo" id="periodo" />
                <Label htmlFor="periodo" className="cursor-pointer">Período</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Opção de formato removida, exportação será sempre em tabela/lista */}

          {tipo === 'periodo' && (
            <div className="space-y-2">
              <Label className="text-sm sm:text-base">Período</Label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <input type="date" value={periodoInicio} onChange={e => setPeriodoInicio(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm w-full sm:w-auto" />
                <span className="text-sm text-muted-foreground">até</span>
                <input type="date" value={periodoFim} onChange={e => setPeriodoFim(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm w-full sm:w-auto" />
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Label className="text-sm sm:text-base font-semibold">Filtrar por Igreja</Label>
            <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-2 sm:p-3">
              {igrejas.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma igreja cadastrada</p>
              ) : (
                igrejas.map((igreja) => (
                  <div key={igreja.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`igreja-${igreja.id}`}
                      checked={igrejasFiltradas.includes(String(igreja.id))}
                      onCheckedChange={(checked) => {
                        const sid = String(igreja.id);
                        if (checked) {
                          setIgrejasFiltradas([...igrejasFiltradas, sid]);
                        } else {
                          setIgrejasFiltradas(igrejasFiltradas.filter((id) => id !== sid));
                        }
                      }}
                    />
                    <Label htmlFor={`igreja-${igreja.id}`} className="cursor-pointer text-sm">
                      {igreja.nome}
                    </Label>
                  </div>
                ))
              )}
            </div>
          </div>

          {departamentosDisponiveis.length > 0 && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">Filtrar por Departamento</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-3">
                {departamentosDisponiveis.map((dep) => (
                  <div key={`${dep.igrejaId}-${dep.id}`} className="flex items-center space-x-2">
                    <Checkbox
                      id={`dep-${dep.igrejaId}-${dep.id}`}
                      checked={departamentosFiltrados.includes(String(dep.id))}
                      onCheckedChange={(checked) => {
                        const sid = String(dep.id);
                        if (checked) {
                          setDepartamentosFiltrados([...departamentosFiltrados, sid]);
                        } else {
                          setDepartamentosFiltrados(departamentosFiltrados.filter((id) => id !== sid));
                        }
                      }}
                    />
                    <Label htmlFor={`dep-${dep.igrejaId}-${dep.id}`} className="cursor-pointer text-sm">
                      {dep.nome} <span className="text-xs text-muted-foreground">({dep.igrejaNome})</span>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {orgaosDisponiveis.length > 0 && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">Filtrar por Órgão</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-3">
                {orgaosDisponiveis.map((org) => (
                  <div key={`${org.igrejaId}-${org.id}`} className="flex items-center space-x-2">
                    <Checkbox
                      id={`org-${org.igrejaId}-${org.id}`}
                      checked={orgaosFiltrados.includes(String(org.id))}
                      onCheckedChange={(checked) => {
                        const sid = String(org.id);
                        if (checked) {
                          setOrgaosFiltrados([...orgaosFiltrados, sid]);
                        } else {
                          setOrgaosFiltrados(orgaosFiltrados.filter((id) => id !== sid));
                        }
                      }}
                    />
                    <Label htmlFor={`org-${org.igrejaId}-${org.id}`} className="cursor-pointer text-sm">
                      {org.nome} <span className="text-xs text-muted-foreground">({org.igrejaNome})</span>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Label className="text-base font-semibold">O que exportar?</Label>
            <RadioGroup
              value={String(tipoExportacao)}
              onValueChange={v => setTipoExportacao(Number(v) as 0 | 1 | 2)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="0" id="exportar-eventos" />
                <Label htmlFor="exportar-eventos" className="cursor-pointer text-sm">
                  Só eventos (calendário)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="1" id="exportar-aniversarios" />
                <Label htmlFor="exportar-aniversarios" className="cursor-pointer text-sm">
                  Só aniversários
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="2" id="exportar-ambos" />
                <Label htmlFor="exportar-ambos" className="cursor-pointer text-sm">
                  Eventos e aniversários
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
          <Button variant="outline" onClick={onFechar} disabled={carregando} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button onClick={gerarPDF} disabled={carregando} className="w-full sm:w-auto">
            {carregando ? (
              <>
                Gerando PDF...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Exportar PDF
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
