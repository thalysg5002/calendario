// API client com persistência em LocalStorage
import type { Aniversario, Evento, Igreja } from '@shared/api';
import { aniversariosAPI, eventosAPI, igrejasAPI } from './storage-api';

// === IGREJAS ===

export async function buscarIgrejas(): Promise<Igreja[]> {
  return Promise.resolve(igrejasAPI.getAll());
}

export async function criarIgreja(data: Omit<Igreja, 'id' | 'created_at'>): Promise<Igreja> {
  return Promise.resolve(igrejasAPI.create(data));
}

export async function atualizarIgreja(id: number, data: Partial<Omit<Igreja, 'id'>>): Promise<Igreja> {
  const result = igrejasAPI.update(id, data);
  if (!result) throw new Error('Igreja não encontrada');
  return Promise.resolve(result);
}

export async function deletarIgreja(id: number): Promise<void> {
  const success = igrejasAPI.delete(id);
  if (!success) throw new Error('Igreja não encontrada');
  return Promise.resolve();
}

// === EVENTOS ===

export async function buscarEventos(inicio?: string, fim?: string): Promise<Evento[]> {
  let eventos = eventosAPI.getAll();
  
  // Filtrar por data se fornecido
  if (inicio && fim) {
    eventos = eventos.filter(e => {
      const dataInicio = new Date(e.data_inicio);
      const dataFim = new Date(e.data_fim);
      const filtroInicio = new Date(inicio);
      const filtroFim = new Date(fim);
      
      return dataInicio <= filtroFim && dataFim >= filtroInicio;
    });
  }
  
  return Promise.resolve(eventos);
}

export async function criarEvento(data: Omit<Evento, 'id' | 'created_at'>): Promise<Evento> {
  return Promise.resolve(eventosAPI.create(data));
}

export async function atualizarEvento(id: number, data: Partial<Omit<Evento, 'id'>>): Promise<Evento> {
  const result = eventosAPI.update(id, data);
  if (!result) throw new Error('Evento não encontrado');
  return Promise.resolve(result);
}

export async function deletarEvento(id: number): Promise<void> {
  const success = eventosAPI.delete(id);
  if (!success) throw new Error('Evento não encontrado');
  return Promise.resolve();
}

// === ANIVERSÁRIOS ===

export async function buscarAniversarios(): Promise<Aniversario[]> {
  return Promise.resolve(aniversariosAPI.getAll());
}

export async function buscarAniversariosPorMes(mes: number): Promise<Aniversario[]> {
  return Promise.resolve(aniversariosAPI.getByMes(mes));
}

export async function criarAniversario(data: Omit<Aniversario, 'id' | 'created_at'>): Promise<Aniversario> {
  return Promise.resolve(aniversariosAPI.create(data));
}

export async function atualizarAniversario(id: number, data: Partial<Omit<Aniversario, 'id'>>): Promise<Aniversario> {
  const result = aniversariosAPI.update(id, data);
  if (!result) throw new Error('Aniversário não encontrado');
  return Promise.resolve(result);
}

export async function deletarAniversario(id: number): Promise<void> {
  const success = aniversariosAPI.delete(id);
  if (!success) throw new Error('Aniversário não encontrado');
  return Promise.resolve();
}