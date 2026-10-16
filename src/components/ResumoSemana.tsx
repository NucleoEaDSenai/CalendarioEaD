import { addDays, eachDayOfInterval, isBefore, isToday, isWeekend, nextMonday, startOfDay, startOfWeek } from 'date-fns';
import { Users } from 'lucide-react';
import { useAusencias } from '../hooks/useAusencias';
import { formatarDia, toISO } from '../lib/datas';
import type { Feriado } from '../types';

/**
 * Desfalques da segunda da semana atual até o mesmo dia da semana seguinte.
 * Ex.: numa quarta, mostra Seg → Qua seguinte; dias passados ficam apagados e hoje, destacado.
 * No fim de semana, passa a considerar a semana que começa na próxima segunda.
 */
function periodoDoResumo(hoje: Date) {
  const referencia = isWeekend(hoje) ? nextMonday(hoje) : startOfDay(hoje);
  return {
    inicio: startOfWeek(referencia, { weekStartsOn: 1 }),
    fim: addDays(referencia, 7),
  };
}

export function ResumoSemana({ feriados }: { feriados: Record<string, Feriado> }) {
  const hoje = startOfDay(new Date());
  const { inicio, fim } = periodoDoResumo(hoje);
  const { porDia } = useAusencias(toISO(inicio), toISO(fim));
  const dias = eachDayOfInterval({ start: inicio, end: fim }).filter((d) => !isWeekend(d));

  return (
    <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm" aria-labelledby="resumo-semana-titulo">
      <h2 id="resumo-semana-titulo" className="flex items-center gap-2 font-semibold text-slate-900">
        <Users className="size-4 text-sky-600" /> Resumo da semana
      </h2>
      <p className="mb-3 text-sm text-slate-500 capitalize">
        {formatarDia(inicio, 'EEEEEE d/MM')} → {formatarDia(fim, 'EEEEEE d/MM')}
      </p>

      <ul className="flex flex-col gap-1">
        {dias.map((dia) => {
          const iso = toISO(dia);
          const feriado = feriados[iso];
          const nomes = [...new Set((porDia.get(iso) ?? []).map((a) => a.nomeUsuario))];
          const passado = isBefore(dia, hoje);
          const ehHoje = isToday(dia);

          return (
            <li
              key={iso}
              aria-current={ehHoje ? 'date' : undefined}
              className={`flex gap-3 rounded-lg px-2.5 py-2 text-sm ${
                ehHoje ? 'bg-sky-50 ring-1 ring-sky-300' : ''
              } ${passado ? 'opacity-40' : ''}`}
            >
              <span className={`w-16 shrink-0 capitalize tabular-nums ${ehHoje ? 'font-semibold text-sky-800' : 'text-slate-500'}`}>
                {formatarDia(dia, 'EEEEEE d/MM')}
              </span>
              <span className="min-w-0 flex-1">
                {feriado ? (
                  <span className="text-slate-400 italic">{feriado.nome}</span>
                ) : nomes.length ? (
                  <span className="text-slate-800">{nomes.join(', ')}</span>
                ) : (
                  <span className="text-slate-300">—</span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
