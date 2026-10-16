import { useEffect, useMemo, useState } from 'react';
import { api, assinar } from '../lib/api';
import type { Ausencia, AusenciaComId } from '../types';

/** Ausências entre duas datas ISO (inclusive), atualizadas em tempo real. */
export function useAusencias(inicio: string, fim: string) {
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
