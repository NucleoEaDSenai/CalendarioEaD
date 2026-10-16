import { api } from '../lib/api';
import type { Feriado, TipoFeriado } from '../types';

interface FeriadoBrasilAPI {
  date: string;
  name: string;
  type: string;
}

async function buscarAno(ano: number) {
  const res = await fetch(`https://brasilapi.com.br/api/feriados/v1/${ano}`);
  if (!res.ok) throw new Error(`BrasilAPI respondeu ${res.status} para ${ano}`);
  return (await res.json()) as FeriadoBrasilAPI[];
}

/** Importa os feriados nacionais dos anos informados numa única gravação (ou todos, ou nenhum). */
export async function importarDaBrasilAPI(anos: number[]) {
  const listas = await Promise.all(anos.map(buscarAno));
  const feriados: Record<string, Feriado> = {};
  for (const f of listas.flat()) {
    const tipo: TipoFeriado = f.type === 'estadual' || f.type === 'municipal' ? f.type : 'nacional';
    feriados[f.date] = { nome: f.name, tipo };
  }
  return api<{ total: number }>('/feriados', { metodo: 'POST', corpo: feriados });
}

export function salvarFeriado(data: string, feriado: Feriado) {
  return api<{ total: number }>('/feriados', { metodo: 'POST', corpo: { [data]: feriado } });
}

export function excluirFeriado(data: string) {
  return api('/feriados/' + data, { metodo: 'DELETE' });
}
