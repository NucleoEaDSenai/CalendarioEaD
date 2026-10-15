import * as Popover from '@radix-ui/react-popover';
import type { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { formatarDia } from '../lib/datas';
import { excluirAusencia } from '../services/ausencias';
import type { AusenciaComId } from '../types';
import { CardAusencia } from './CardAusencia';
import { useToast } from './Toaster';

export function PopupAusencias({
  dia,
  ausencias,
  onEditar,
  children,
}: {
  dia: Date;
  ausencias: AusenciaComId[];
  onEditar: (a: AusenciaComId) => void;
  children: ReactNode;
}) {
  const { user, isLideranca } = useAuth();
  const avisar = useToast();

  const excluir = async (a: AusenciaComId) => {
    if (!confirm(`Excluir a ausência de ${a.nomeUsuario}?`)) return;
    try {
      await excluirAusencia(a.id);
      avisar('Ausência excluída');
    } catch (e) {
      avisar((e as Error).message, 'erro');
    }
  };

  return (
    <Popover.Root>
      <Popover.Trigger asChild>{children}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={6}
          collisionPadding={12}
          className="z-30 max-h-[70vh] w-[min(92vw,20rem)] overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 shadow-xl focus:outline-none"
        >
          <p className="mb-2 text-sm font-semibold text-slate-900 capitalize">
            {formatarDia(dia, "EEEE, d 'de' MMMM")} · {ausencias.length} ausente{ausencias.length > 1 ? 's' : ''}
          </p>
          <ul className="flex flex-col gap-2">
            {ausencias.map((a) => (
              <CardAusencia
                key={a.id}
                ausencia={a}
                podeGerenciar={isLideranca || a.userId === user?.uid}
                onEditar={() => onEditar(a)}
                onExcluir={() => excluir(a)}
              />
            ))}
          </ul>
          <Popover.Arrow className="fill-white" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
