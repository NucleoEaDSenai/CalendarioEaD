import { useEffect, useState } from 'react';
import { api, assinar } from '../lib/api';
import type { Usuario, UsuarioComId } from '../types';

/** Lista de pessoas (para o select da liderança), ordenada por nome. */
export function useUsuarios() {
  const [usuarios, setUsuarios] = useState<UsuarioComId[]>([]);

  useEffect(() => {
    let ativo = true;
    const carregar = () =>
      api<Record<string, Usuario>>('/usuarios')
        .then((u) => {
          if (!ativo) return;
          setUsuarios(
            Object.entries(u)
              .map(([uid, dados]) => ({ uid, ...dados }))
              .sort((a, b) => a.nome.localeCompare(b.nome)),
          );
        })
        .catch(() => undefined);
    carregar();
    const cancelar = assinar('usuarios', carregar);
    return () => {
      ativo = false;
      cancelar();
    };
  }, []);

  return usuarios;
}
