import { isSameMonth, isToday, isWeekend } from "date-fns";
import { Plus } from "lucide-react";
import { useState } from "react";
import { formatarDia } from "../lib/datas";
import type { AusenciaComId, Feriado } from "../types";
import { CardPopUp } from "./CardPopUp";

/** Mapa de calor: escurece conforme a quantidade de ausentes (1 / 2–3 / 4+). */
function corPorQuantidade(n: number) {
  if (n >= 4) return "bg-sky-300 hover:bg-sky-400/70";
  if (n >= 2) return "bg-sky-200 hover:bg-sky-300/70";
  return "bg-sky-100 hover:bg-sky-200/70";
}

export function DiaCelula({
  dia,
  mes,
  feriado,
  ausencias,
  onAdicionar,
  onEditar,
}: {
  dia: Date;
  mes: Date;
  feriado?: Feriado;
  ausencias: AusenciaComId[];
  onAdicionar: () => void;
  onEditar: (a: AusenciaComId) => void;
}) {
  const [popupAberto, setPopupAberto] = useState(false);
  const bloqueado = isWeekend(dia) || !!feriado;
  const qtd = ausencias.length;
  const fora = !isSameMonth(dia, mes);
  const rotulo = formatarDia(dia, "d 'de' MMMM");

  const fundo = bloqueado
    ? "bg-slate-100"
    : qtd > 0
      ? corPorQuantidade(qtd)
      : "bg-white";

  const numero = (
    <span
      className={`inline-flex size-7 items-center justify-center rounded-full text-sm font-medium sm:size-8 sm:text-base ${
        isToday(dia)
          ? "bg-sky-600 text-white"
          : bloqueado
            ? "text-slate-400"
            : "text-slate-800"
      }`}
    >
      {formatarDia(dia, "d")}
    </span>
  );

  return (
    <div
      className={`relative min-h-20 border-r border-b border-slate-200 sm:min-h-32 lg:min-h-36 xl:min-h-40 ${fundo} ${fora ? "opacity-45" : ""}`}
    >
      {qtd > 0 ? (
        <button
          onClick={() => setPopupAberto(true)}
          className="flex h-full w-full cursor-pointer flex-col items-start p-1.5 text-left sm:p-2"
          aria-label={`${rotulo}: ${qtd} ausente${qtd > 1 ? "s" : ""}. Ver detalhes`}
        >
          {numero}
          <span className="mt-auto rounded-md bg-sky-700 px-1.5 py-0.5 text-xs font-semibold text-white sm:px-2.5 sm:py-1 sm:text-sm">
            {qtd}
          </span>
        </button>
      ) : (
        <div
          className="flex h-full flex-col p-1.5 sm:p-2"
          aria-disabled={bloqueado || undefined}
        >
          {numero}
        </div>
      )}

      {feriado && (
        <p
          className="pointer-events-none absolute right-1.5 bottom-1.5 left-1.5 line-clamp-2 text-[10px] leading-tight text-slate-500 sm:right-2 sm:bottom-2 sm:left-2 sm:text-sm"
          title={feriado.nome}
        >
          {feriado.nome}
        </p>
      )}

      {!bloqueado && (
        <button
          onClick={onAdicionar}
          className="absolute top-1 right-1 rounded-md p-1 text-slate-500 hover:bg-white/80 hover:text-sky-700 sm:top-1.5 sm:right-1.5 sm:p-1.5"
          aria-label={`Marcar ausência em ${rotulo}`}
        >
          <Plus className="size-4 sm:size-5 cursor-pointer" />
        </button>
      )}

      {/* Fecha sozinho se a última ausência do dia for excluída. */}
      <CardPopUp
        aberto={popupAberto && qtd > 0}
        dia={dia}
        ausencias={ausencias}
        onFechar={() => setPopupAberto(false)}
        onEditar={onEditar}
      />
    </div>
  );
}
