import { useEffect, useMemo, useState } from 'react';
import { endOfMonth, startOfMonth } from 'date-fns';
import { api, assinar } from '../lib/api';
import { gerarGradeMes, toISO } from '../lib/datas';
import type { Ausencia, AusenciaComId } from '../types';

/** Ausências da grade visível (inclui dias dos meses vizinhos), atualizadas em tempo real. */
export function useAusenciasDoMes(mes: Date) {
  const grade = gerarGradeMes(mes);
  const inicio = toISO(grade[0] ?? startOfMonth(mes));
  const fim = toISO(grade[grade.length - 1] ?? endOfMonth(mes));

  const [ausencias, setAusencias] = useState<AusenciaComId[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    const carregar = () =>
      api<Record<string, Ausencia>>(`/ausencias?inicio=${inicio}&fim=${fim}`)
        .then((dados) => {
          if (!ativo) return;
          setAusencias(Object.entries(dados).map(([id, a]) => ({ id, ...a })));
          setErro(null);
        })
        .catch((e: Error) => ativo && setErro(e.message))
        .finally(() => ativo && setCarregando(false));

    setCarregando(true);
    carregar();
    const cancelar = assinar('ausencias', carregar);
    return () => {
      ativo = false;
      cancelar();
    };
  }, [inicio, fim]);

  const porDia = useMemo(() => {
    const m = new Map<string, AusenciaComId[]>();
    for (const a of ausencias) {
      if (!m.has(a.data)) m.set(a.data, []);
      m.get(a.data)!.push(a);
    }
    for (const lista of m.values()) lista.sort((x, y) => x.nomeUsuario.localeCompare(y.nomeUsuario));
    return m;
  }, [ausencias]);

  return { ausencias, porDia, carregando, erro };
}
