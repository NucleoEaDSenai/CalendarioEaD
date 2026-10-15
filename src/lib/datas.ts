import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isWeekend,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const toISO = (d: Date) => format(d, 'yyyy-MM-dd');

/** Converte 'YYYY-MM-DD' em Date local (sem o deslocamento de fuso do `new Date(iso)`). */
export const fromISO = (iso: string) => {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d);
};

export function gerarGradeMes(mes: Date): Date[] {
  return eachDayOfInterval({
    start: startOfWeek(startOfMonth(mes), { locale: ptBR }),
    end: endOfWeek(endOfMonth(mes), { locale: ptBR }),
  });
}

export function ehDiaUtil(d: Date, feriados: ReadonlySet<string>) {
  return !isWeekend(d) && !feriados.has(toISO(d));
}

export const formatarDia = (d: Date, padrao: string) => format(d, padrao, { locale: ptBR });
