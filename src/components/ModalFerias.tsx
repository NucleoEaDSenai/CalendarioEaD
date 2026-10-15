import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUsuarios } from '../hooks/useUsuarios';
import { diasDeFerias, marcarFerias } from '../services/ausencias';
import { estilos, Modal } from './Modal';
import { useToast } from './Toaster';

export function ModalFerias({
  aberto,
  feriados,
  onFechar,
}: {
  aberto: boolean;
  feriados: ReadonlySet<string>;
  onFechar: () => void;
}) {
  const { user, perfil, isLideranca } = useAuth();
  const usuarios = useUsuarios();
  const avisar = useToast();
  const [userId, setUserId] = useState('');
  const [inicio, setInicio] = useState('');
  const [fim, setFim] = useState('');
  const [dias, setDias] = useState<string[] | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (aberto) {
      setUserId(user?.uid ?? '');
      setInicio('');
      setFim('');
      setDias(null);
    }
  }, [aberto, user]);

  const periodoInvalido = !!inicio && !!fim && fim < inicio;

  // Resumo ao vivo: "Serão marcados N dias úteis".
  useEffect(() => {
    setDias(null);
    if (!userId || !inicio || !fim || fim < inicio) return;
    let ativo = true;
    diasDeFerias(userId, inicio, fim, feriados)
      .then((d) => ativo && setDias(d))
      .catch((e: Error) => avisar(e.message, 'erro'));
    return () => {
      ativo = false;
    };
  }, [userId, inicio, fim, feriados, avisar]);

  const confirmar = async () => {
    if (!dias?.length) return;
    setSalvando(true);
    try {
      await marcarFerias(isLideranca ? userId : user!.uid, dias);
      avisar(`${dias.length} dia${dias.length > 1 ? 's' : ''} de férias marcado${dias.length > 1 ? 's' : ''}`);
      onFechar();
    } catch (e) {
      avisar((e as Error).message, 'erro');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo="Marcar férias" descricao="Fins de semana, feriados e dias já marcados são ignorados.">
      <div className="flex flex-col gap-4">
        <div>
          <label className={estilos.rotulo} htmlFor="ferias-nome">Nome</label>
          {isLideranca ? (
            <select id="ferias-nome" className={estilos.campo} value={userId} onChange={(e) => setUserId(e.target.value)}>
              {usuarios.map((u) => (
                <option key={u.uid} value={u.uid}>{u.nome}</option>
              ))}
            </select>
          ) : (
            <input id="ferias-nome" className={estilos.campo} value={perfil?.nome ?? ''} disabled readOnly />
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={estilos.rotulo} htmlFor="ferias-inicio">Data inicial</label>
            <input id="ferias-inicio" type="date" className={estilos.campo} value={inicio} onChange={(e) => setInicio(e.target.value)} />
          </div>
          <div>
            <label className={estilos.rotulo} htmlFor="ferias-fim">Data final</label>
            <input id="ferias-fim" type="date" className={estilos.campo} value={fim} min={inicio || undefined} onChange={(e) => setFim(e.target.value)} />
          </div>
        </div>
        {periodoInvalido && <p className={estilos.erro}>A data final deve ser igual ou posterior à inicial.</p>}

        {dias && (
          <p className="rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-900">
            {dias.length === 0
              ? 'Nenhum dia útil livre nesse período.'
              : `Serão marcados ${dias.length} dia${dias.length > 1 ? 's' : ''} úte${dias.length > 1 ? 'is' : 'il'}.`}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className={estilos.botaoSecundario} onClick={onFechar}>Cancelar</button>
          <button type="button" className={estilos.botaoPrimario} onClick={confirmar} disabled={!dias?.length || salvando}>
            {salvando ? 'Salvando…' : 'Confirmar'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
