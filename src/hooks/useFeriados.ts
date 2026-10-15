import { useEffect, useMemo, useState } from 'react';
import { api, assinar } from '../lib/api';
import type { Feriado } from '../types';

export function useFeriados() {
  const [feriados, setFeriados] = useState<Record<string, Feriado>>({});

  useEffect(() => {
    let ativo = true;
    const carregar = () =>
      api<Record<string, Feriado>>('/feriados')
        .then((f) => ativo && setFeriados(f))
        .catch(() => undefined);
    carregar();
    const cancelar = assinar('feriados', carregar);
    return () => {
      ativo = false;
      cancelar();
    };
  }, []);

  const datas = useMemo(() => new Set(Object.keys(feriados)), [feriados]);
  return { feriados, datas };
}
