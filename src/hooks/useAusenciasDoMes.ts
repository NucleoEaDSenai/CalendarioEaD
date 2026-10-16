import { gerarGradeMes, toISO } from '../lib/datas';
import { useAusencias } from './useAusencias';

/** Ausências da grade visível (inclui dias dos meses vizinhos), atualizadas em tempo real. */
export function useAusenciasDoMes(mes: Date) {
  const grade = gerarGradeMes(mes);
  return useAusencias(toISO(grade[0]), toISO(grade[grade.length - 1]));
}
