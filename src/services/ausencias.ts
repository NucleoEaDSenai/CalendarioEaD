import { eachDayOfInterval } from 'date-fns';
import { api } from '../lib/api';
import { ehDiaUtil, fromISO, toISO } from '../lib/datas';
import type { Ausencia, AusenciaEntrada } from '../types';

export function criarAusencia(entrada: AusenciaEntrada) {
  return api<{ id: string }>('/ausencias', { metodo: 'POST', corpo: entrada });
}

export function editarAusencia(id: string, entrada: AusenciaEntrada) {
  return api('/ausencias/' + id, { metodo: 'PUT', corpo: entrada });
}

export function excluirAusencia(id: string) {
  return api('/ausencias/' + id, { metodo: 'DELETE' });
}

/** Dias úteis do período em que a pessoa ainda não tem ausência. */
export async function diasDeFerias(
  userId: string,
  inicioISO: string,
  fimISO: string,
  feriados: ReadonlySet<string>,
): Promise<string[]> {
  const existentes = await api<Record<string, Ausencia>>(`/ausencias?inicio=${inicioISO}&fim=${fimISO}`);
  const ocupados = new Set(Object.values(existentes).filter((a) => a.userId === userId).map((a) => a.data));
  return eachDayOfInterval({ start: fromISO(inicioISO), end: fromISO(fimISO) })
    .filter((d) => ehDiaUtil(d, feriados))
    .map(toISO)
    .filter((iso) => !ocupados.has(iso));
}

/** Grava um registro por dia, de forma atômica (equivalente ao update() multi-path). */
export function marcarFerias(userId: string, dias: string[]) {
  return api<{ ids: string[] }>('/ferias', { metodo: 'POST', corpo: { userId, dias } });
}
