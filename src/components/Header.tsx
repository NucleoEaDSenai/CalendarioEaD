import { addMonths, subMonths } from 'date-fns';
import { CalendarDays, ChevronLeft, ChevronRight, Download, Flag, LogOut, Palmtree } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { formatarDia } from '../lib/datas';
import { importarDaBrasilAPI } from '../services/feriados';
import { estilos } from './Modal';
import { useToast } from './Toaster';

export function Header({
  mes,
  onMudarMes,
  onMarcarFerias,
  onGerenciarFeriados,
}: {
  mes: Date;
  onMudarMes: (d: Date) => void;
  onMarcarFerias: () => void;
  onGerenciarFeriados: () => void;
}) {
  const { perfil, isLideranca, sair } = useAuth();
  const avisar = useToast();
  const [importando, setImportando] = useState(false);
  const ano = mes.getFullYear();

  const importar = async () => {
    setImportando(true);
    try {
      const { total } = await importarDaBrasilAPI([ano, ano + 1]);
      avisar(`${total} feriados de ${ano} e ${ano + 1} importados`);
    } catch (e) {
      avisar((e as Error).message, 'erro');
    } finally {
      setImportando(false);
    }
  };

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2 font-semibold text-slate-900">
          <CalendarDays className="size-5 text-sky-600" />
          Calendário EAD
        </div>

        <nav className="flex items-center gap-1" aria-label="Navegação de mês">
          <button className="rounded-md p-1.5 hover:bg-slate-100" onClick={() => onMudarMes(subMonths(mes, 1))} aria-label="Mês anterior">
            <ChevronLeft className="size-5" />
          </button>
          <span className="w-36 text-center font-medium capitalize">{formatarDia(mes, 'MMMM yyyy')}</span>
          <button className="rounded-md p-1.5 hover:bg-slate-100" onClick={() => onMudarMes(addMonths(mes, 1))} aria-label="Próximo mês">
            <ChevronRight className="size-5" />
          </button>
          <button className={`${estilos.botaoSecundario} ml-1 px-3 py-1.5`} onClick={() => onMudarMes(new Date())}>
            Hoje
          </button>
        </nav>

        <div className="flex flex-wrap items-center gap-2">
          <button className={`${estilos.botaoPrimario} px-3 py-1.5`} onClick={onMarcarFerias}>
            <Palmtree className="size-4" /> Marcar férias
          </button>
          {isLideranca && (
            <>
              <button className={`${estilos.botaoSecundario} px-3 py-1.5`} onClick={importar} disabled={importando}>
                <Download className="size-4" /> {importando ? 'Importando…' : `Importar feriados ${ano}–${ano + 1}`}
              </button>
              <button className={`${estilos.botaoSecundario} px-3 py-1.5`} onClick={onGerenciarFeriados}>
                <Flag className="size-4" /> Feriados locais
              </button>
            </>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2 text-sm text-slate-600">
          <span>
            {perfil?.nome}
            {isLideranca && <span className="ml-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">liderança</span>}
          </span>
          <button className="rounded-md p-1.5 hover:bg-slate-100" onClick={sair} aria-label="Sair" title="Sair">
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
