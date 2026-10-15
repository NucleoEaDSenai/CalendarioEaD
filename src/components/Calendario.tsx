import { gerarGradeMes, toISO } from '../lib/datas';
import type { AusenciaComId, Feriado } from '../types';
import { DiaCelula } from './DiaCelula';

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function Calendario({
  mes,
  feriados,
  porDia,
  onAdicionar,
  onEditar,
}: {
  mes: Date;
  feriados: Record<string, Feriado>;
  porDia: Map<string, AusenciaComId[]>;
  onAdicionar: (dia: Date) => void;
  onEditar: (a: AusenciaComId) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border-t border-l border-slate-200 bg-white shadow-sm">
      <div className="grid grid-cols-7">
        {DIAS_SEMANA.map((d) => (
          <div key={d} className="border-r border-b border-slate-200 bg-slate-50 py-2.5 text-center text-xs font-medium text-slate-500 sm:text-sm">
            {d}
          </div>
        ))}
        {gerarGradeMes(mes).map((dia) => {
          const iso = toISO(dia);
          return (
            <DiaCelula
              key={iso}
              dia={dia}
              mes={mes}
              feriado={feriados[iso]}
              ausencias={porDia.get(iso) ?? []}
              onAdicionar={() => onAdicionar(dia)}
              onEditar={onEditar}
            />
          );
        })}
      </div>
    </div>
  );
}
