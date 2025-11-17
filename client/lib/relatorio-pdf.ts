import { 
  gerarCalendarioMensalPDF, 
  gerarCalendarioAnualPDF, 
  gerarRelatorioAniversariosPDF 
} from './pdf-avancado-v2';
import { downloadBlob, formatarNomeArquivo, mostrarNotificacao } from './download-utils';
import { buscarEventos, buscarAniversarios, buscarAniversariosPorMes, buscarIgrejas } from './api-client';

// Função para gerar relatório mensal
export async function gerarRelatorioPDFMensal(ano?: number, mes?: number, igrejaId?: string) {
  try {
    const anoAtual = ano || new Date().getFullYear();
    const mesAtual = mes || new Date().getMonth() + 1;
    
    mostrarNotificacao('sucesso', 'Gerando relatório mensal...');
    
    // Buscar dados do servidor
    const inicioMes = new Date(anoAtual, mesAtual - 1, 1).toISOString();
    const fimMes = new Date(anoAtual, mesAtual, 1).toISOString();
    const eventos = await buscarEventos(inicioMes, fimMes);
    const aniversarios = await buscarAniversariosPorMes(mesAtual);
    
    let igreja = undefined;
    if (igrejaId) {
      const igrejas = await buscarIgrejas();
      igreja = igrejas.find(i => String(i.id) === String(igrejaId));
    }
    
    const pdfBlob = await gerarCalendarioMensalPDF(anoAtual, mesAtual, eventos, aniversarios, igreja);
    const nomeArquivo = formatarNomeArquivo('mensal', anoAtual, mesAtual);
    
    downloadBlob(pdfBlob, nomeArquivo);
    mostrarNotificacao('sucesso', 'Relatório mensal gerado com sucesso!');
    
    return true;
  } catch (error) {
    console.error('Erro ao gerar PDF mensal:', error);
    mostrarNotificacao('erro', 'Erro ao gerar relatório mensal');
    return false;
  }
}

// Função para gerar relatório anual
export async function gerarRelatorioPDFAnual(ano?: number, igrejaId?: string) {
  try {
    const anoAtual = ano || new Date().getFullYear();
    
    mostrarNotificacao('sucesso', 'Gerando relatório anual...');
    
    // Buscar dados do servidor
    const inicioAno = new Date(anoAtual, 0, 1).toISOString();
    const fimAno = new Date(anoAtual + 1, 0, 1).toISOString();
    const eventos = await buscarEventos(inicioAno, fimAno);
    const aniversarios = await buscarAniversarios();
    
    let igreja = undefined;
    if (igrejaId) {
      const igrejas = await buscarIgrejas();
      igreja = igrejas.find(i => String(i.id) === String(igrejaId));
    }
    
    const pdfBlob = await gerarCalendarioAnualPDF(anoAtual, eventos, aniversarios, igreja);
    const nomeArquivo = formatarNomeArquivo('anual', anoAtual);
    
    downloadBlob(pdfBlob, nomeArquivo);
    mostrarNotificacao('sucesso', 'Relatório anual gerado com sucesso!');
    
    return true;
  } catch (error) {
    console.error('Erro ao gerar PDF anual:', error);
    mostrarNotificacao('erro', 'Erro ao gerar relatório anual');
    return false;
  }
}

// Função para gerar relatório de aniversários
export async function gerarRelatorioPDF(igrejaId?: string) {
  try {
    mostrarNotificacao('sucesso', 'Gerando relatório de aniversários...');
    
    // Buscar dados do servidor
    const aniversarios = await buscarAniversarios();
    
    let igreja = undefined;
    if (igrejaId) {
      const igrejas = await buscarIgrejas();
      igreja = igrejas.find(i => String(i.id) === String(igrejaId));
    }
    
    const pdfBlob = await gerarRelatorioAniversariosPDF(aniversarios, igreja);
    const nomeArquivo = formatarNomeArquivo('aniversarios');
    
    downloadBlob(pdfBlob, nomeArquivo);
    mostrarNotificacao('sucesso', 'Relatório de aniversários gerado com sucesso!');
    
    return true;
  } catch (error) {
    console.error('Erro ao gerar PDF de aniversários:', error);
    mostrarNotificacao('erro', 'Erro ao gerar relatório de aniversários');
    return false;
  }
}
