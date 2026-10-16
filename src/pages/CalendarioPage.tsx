import { startOfMonth } from 'date-fns';
import { useState } from 'react';
import { Calendario } from '../components/Calendario';
import { Header } from '../components/Header';
import { ModalAusencia } from '../components/ModalAusencia';
import { ModalFeriados } from '../components/ModalFeriados';
import { ModalFerias } from '../components/ModalFerias';
import { ResumoSemana } from '../components/ResumoSemana';
import { useAusenciasDoMes } from '../hooks/useAusenciasDoMes';
import { useFeriados } from '../hooks/useFeriados';
import type { AusenciaComId } from '../types';

type ModalAberto =
  | { tipo: 'ausencia'; dia?: Date; ausencia?: AusenciaComId }
  | { tipo: 'ferias' }
  | { tipo: 'feriados' }
  | null;

export function CalendarioPage() {
  const [mes, setMes] = useState(() => startOfMonth(new Date()));
  const [modal, setModal] = useState<ModalAberto>(null);
  const { feriados, datas } = useFeriados();
  const { porDia, carregando, erro } = useAusenciasDoMes(mes);
  const fechar = () => setModal(null);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header
        mes={mes}
        onMudarMes={(d) => setMes(startOfMonth(d))}
        onMarcarFerias={() => setModal({ tipo: 'ferias' })}
        onGerenciarFeriados={() => setModal({ tipo: 'feriados' })}
      />

      <main className="mx-auto max-w-[1600px] px-2 py-4 sm:px-6">
        {erro && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">Erro ao carregar ausências: {erro}</p>}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1">
            <div className={carregando ? 'opacity-60 transition-opacity' : 'transition-opacity'} aria-busy={carregando}>
              <Calendario
                mes={mes}
                feriados={feriados}
                porDia={porDia}
                onAdicionar={(dia) => setModal({ tipo: 'ausencia', dia })}
                onEditar={(ausencia) => setModal({ tipo: 'ausencia', ausencia })}
              />
            </div>
            <Legenda />
          </div>
          {/* No celular fica acima do calendário; no desktop, à direita. */}
          <div className="order-first lg:order-none lg:sticky lg:top-4 lg:w-80 lg:shrink-0">
            <ResumoSemana feriados={feriados} />
          </div>
        </div>
      </main>

      <ModalAusencia
        aberto={modal?.tipo === 'ausencia'}
        dia={modal?.tipo === 'ausencia' ? modal.dia : undefined}
        ausencia={modal?.tipo === 'ausencia' ? modal.ausencia : undefined}
        onFechar={fechar}
      />
      <ModalFerias aberto={modal?.tipo === 'ferias'} feriados={datas} onFechar={fechar} />
      <ModalFeriados aberto={modal?.tipo === 'feriados'} ano={mes.getFullYear()} feriados={feriados} onFechar={fechar} />
    </div>
  );
}

function Legenda() {
  const itens = [
    ['bg-white border border-slate-300', 'Livre'],
    ['bg-sky-100', '1 ausente'],
    ['bg-sky-200', '2–3'],
    ['bg-sky-300', '4+'],
    ['bg-slate-100 border border-slate-300', 'Fim de semana / feriado'],
  ];
  return (
    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
      {itens.map(([cor, texto]) => (
        <li key={texto} className="flex items-center gap-1.5">
          <span className={`size-3 rounded-sm ${cor}`} /> {texto}
        </li>
      ))}
    </ul>
  );
}
