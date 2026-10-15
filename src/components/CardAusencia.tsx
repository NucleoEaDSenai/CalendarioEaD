import { Pencil, Trash2 } from 'lucide-react';
import { TIPOS_AUSENCIA } from '../constants/tiposAusencia';
import type { AusenciaComId } from '../types';

export function CardAusencia({
  ausencia,
  podeGerenciar,
  onEditar,
  onExcluir,
}: {
  ausencia: AusenciaComId;
  podeGerenciar: boolean;
  onEditar: () => void;
  onExcluir: () => void;
}) {
  const a = ausencia;
  return (
    <li className="rounded-lg border border-slate-200 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-slate-900">{a.nomeUsuario}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="rounded-full bg-sky-100 px-2 py-0.5 font-medium text-sky-800">{TIPOS_AUSENCIA[a.tipo]}</span>
            <span className="text-slate-500">{a.diaTodo ? 'Dia todo' : `${a.horaInicio}–${a.horaFim}`}</span>
          </div>
          {a.motivo && a.tipo !== 'ferias' && <p className="mt-1.5 text-sm break-words text-slate-600">{a.motivo}</p>}
        </div>
        {podeGerenciar && (
          <div className="flex shrink-0 gap-0.5">
            {a.tipo !== 'ferias' && (
              <button className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100" onClick={onEditar} aria-label={`Editar ausência de ${a.nomeUsuario}`}>
                <Pencil className="size-4" />
              </button>
            )}
            <button className="rounded-md p-1.5 text-red-600 hover:bg-red-50" onClick={onExcluir} aria-label={`Excluir ausência de ${a.nomeUsuario}`}>
              <Trash2 className="size-4" />
            </button>
          </div>
        )}
      </div>
    </li>
  );
}
