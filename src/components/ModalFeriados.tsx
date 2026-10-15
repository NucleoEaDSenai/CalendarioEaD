import { Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { formatarDia, fromISO } from '../lib/datas';
import { excluirFeriado, salvarFeriado } from '../services/feriados';
import type { Feriado, TipoFeriado } from '../types';
import { estilos, Modal } from './Modal';
import { useToast } from './Toaster';

/** Cadastro manual de feriados estaduais/municipais (ex.: RJ). Só liderança. */
export function ModalFeriados({
  aberto,
  ano,
  feriados,
  onFechar,
}: {
  aberto: boolean;
  ano: number;
  feriados: Record<string, Feriado>;
  onFechar: () => void;
}) {
  const avisar = useToast();
  const [data, setData] = useState('');
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<TipoFeriado>('estadual');

  const doAno = Object.entries(feriados)
    .filter(([d]) => d.startsWith(`${ano}-`))
    .sort(([a], [b]) => a.localeCompare(b));

  const adicionar = async (e: FormEvent) => {
    e.preventDefault();
    if (!data || !nome.trim()) return;
    try {
      await salvarFeriado(data, { nome: nome.trim(), tipo });
      avisar('Feriado salvo');
      setData('');
      setNome('');
    } catch (err) {
      avisar((err as Error).message, 'erro');
    }
  };

  const remover = async (d: string) => {
    try {
      await excluirFeriado(d);
    } catch (err) {
      avisar((err as Error).message, 'erro');
    }
  };

  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo="Feriados" descricao="Cadastre feriados estaduais e municipais (ex.: São Jorge, São Sebastião).">
      <form onSubmit={adicionar} className="grid grid-cols-2 gap-3">
        <div>
          <label className={estilos.rotulo} htmlFor="feriado-data">Data</label>
          <input id="feriado-data" type="date" className={estilos.campo} value={data} onChange={(e) => setData(e.target.value)} required />
        </div>
        <div>
          <label className={estilos.rotulo} htmlFor="feriado-tipo">Tipo</label>
          <select id="feriado-tipo" className={estilos.campo} value={tipo} onChange={(e) => setTipo(e.target.value as TipoFeriado)}>
            <option value="nacional">Nacional</option>
            <option value="estadual">Estadual</option>
            <option value="municipal">Municipal</option>
            <option value="outro">Outro</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className={estilos.rotulo} htmlFor="feriado-nome">Nome</label>
          <input id="feriado-nome" className={estilos.campo} value={nome} maxLength={100} onChange={(e) => setNome(e.target.value)} required />
        </div>
        <div className="col-span-2 flex justify-end">
          <button type="submit" className={estilos.botaoPrimario}>Adicionar</button>
        </div>
      </form>

      <h3 className="mt-5 mb-2 text-sm font-semibold text-slate-700">Feriados de {ano}</h3>
      {doAno.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhum feriado cadastrado. Use "Importar feriados {ano}" no topo.</p>
      ) : (
        <ul className="divide-y divide-slate-100 text-sm">
          {doAno.map(([d, f]) => (
            <li key={d} className="flex items-center gap-2 py-1.5">
              <span className="w-14 shrink-0 text-slate-500 tabular-nums">{formatarDia(fromISO(d), 'dd/MM')}</span>
              <span className="min-w-0 flex-1 truncate text-slate-800">{f.nome}</span>
              <span className="text-xs text-slate-400">{f.tipo}</span>
              <button className="rounded-md p-1 text-red-600 hover:bg-red-50" onClick={() => remover(d)} aria-label={`Excluir ${f.nome}`}>
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
