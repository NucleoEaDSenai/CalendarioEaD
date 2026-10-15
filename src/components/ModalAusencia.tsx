import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { exigeMotivo, TIPOS_AUSENCIA, TIPOS_DO_DIA } from '../constants/tiposAusencia';
import { useAuth } from '../contexts/AuthContext';
import { useUsuarios } from '../hooks/useUsuarios';
import { formatarDia, fromISO, toISO } from '../lib/datas';
import { criarAusencia, editarAusencia } from '../services/ausencias';
import type { AusenciaComId } from '../types';
import { estilos, Modal } from './Modal';
import { useToast } from './Toaster';

const ausenciaSchema = z
  .object({
    userId: z.string().min(1, 'Selecione a pessoa'),
    tipo: z.enum(TIPOS_DO_DIA),
    motivo: z.string().trim().max(200, 'Máximo de 200 caracteres'),
    diaTodo: z.boolean(),
    horaInicio: z.string().optional(),
    horaFim: z.string().optional(),
  })
  .refine((v) => !exigeMotivo(v.tipo) || v.motivo.length > 0, {
    message: 'Informe o motivo',
    path: ['motivo'],
  })
  .refine((v) => v.diaTodo || (!!v.horaInicio && !!v.horaFim && v.horaFim > v.horaInicio), {
    message: 'Informe início e fim (fim maior que início)',
    path: ['horaFim'],
  });

type Valores = z.infer<typeof ausenciaSchema>;

export function ModalAusencia({
  aberto,
  dia,
  ausencia,
  onFechar,
}: {
  aberto: boolean;
  /** Dia clicado (criação). */
  dia?: Date;
  /** Ausência a editar (edição). */
  ausencia?: AusenciaComId;
  onFechar: () => void;
}) {
  const { user, isLideranca, perfil } = useAuth();
  const usuarios = useUsuarios();
  const avisar = useToast();
  const data = ausencia?.data ?? (dia ? toISO(dia) : '');

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Valores>({ resolver: zodResolver(ausenciaSchema) });

  useEffect(() => {
    if (!aberto) return;
    reset({
      userId: ausencia?.userId ?? user?.uid ?? '',
      tipo: ausencia && ausencia.tipo !== 'ferias' ? ausencia.tipo : 'folga',
      motivo: ausencia?.motivo ?? '',
      diaTodo: ausencia?.diaTodo ?? true,
      horaInicio: ausencia?.horaInicio ?? '09:00',
      horaFim: ausencia?.horaFim ?? '12:00',
    });
  }, [aberto, ausencia, user, reset]);

  const diaTodo = watch('diaTodo');
  const motivoObrigatorio = exigeMotivo(watch('tipo') ?? 'folga');

  const enviar = async (v: Valores) => {
    const entrada = {
      userId: isLideranca ? v.userId : user!.uid,
      data,
      tipo: v.tipo,
      ...(v.motivo ? { motivo: v.motivo } : {}),
      diaTodo: v.diaTodo,
      ...(v.diaTodo ? {} : { horaInicio: v.horaInicio, horaFim: v.horaFim }),
    };
    try {
      if (ausencia) await editarAusencia(ausencia.id, entrada);
      else await criarAusencia(entrada);
      avisar(ausencia ? 'Ausência atualizada' : 'Ausência marcada');
      onFechar();
    } catch (e) {
      avisar((e as Error).message, 'erro');
    }
  };

  return (
    <Modal
      aberto={aberto}
      onFechar={onFechar}
      titulo={ausencia ? 'Editar ausência' : 'Marcar ausência'}
      descricao={data ? formatarDia(fromISO(data), "EEEE, d 'de' MMMM 'de' yyyy") : undefined}
    >
      <form onSubmit={handleSubmit(enviar)} className="flex flex-col gap-4" noValidate>
        <div>
          <label className={estilos.rotulo} htmlFor="userId">Nome</label>
          {isLideranca ? (
            <select id="userId" className={estilos.campo} {...register('userId')}>
              {usuarios.map((u) => (
                <option key={u.uid} value={u.uid}>{u.nome}</option>
              ))}
            </select>
          ) : (
            <input id="userId" className={estilos.campo} value={ausencia?.nomeUsuario ?? perfil?.nome ?? ''} disabled readOnly />
          )}
          {errors.userId && <p className={estilos.erro}>{errors.userId.message}</p>}
        </div>

        <div>
          <label className={estilos.rotulo} htmlFor="tipo">Tipo de ausência</label>
          <select id="tipo" className={estilos.campo} {...register('tipo')}>
            {TIPOS_DO_DIA.map((t) => (
              <option key={t} value={t}>{TIPOS_AUSENCIA[t]}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={estilos.rotulo} htmlFor="motivo">
            Motivo{' '}
            <span className="font-normal text-slate-400">{motivoObrigatorio ? '(obrigatório)' : '(opcional)'}</span>
          </label>
          <input id="motivo" className={estilos.campo} maxLength={200} {...register('motivo')} />
          {errors.motivo && <p className={estilos.erro}>{errors.motivo.message}</p>}
        </div>

        <fieldset>
          <legend className={estilos.rotulo}>Período</legend>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" className="size-4 accent-sky-600" {...register('diaTodo')} />
            Dia todo
          </label>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-slate-500" htmlFor="horaInicio">Hora inicial</label>
              <input id="horaInicio" type="time" className={estilos.campo} disabled={diaTodo} {...register('horaInicio')} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500" htmlFor="horaFim">Hora final</label>
              <input id="horaFim" type="time" className={estilos.campo} disabled={diaTodo} {...register('horaFim')} />
            </div>
          </div>
          {errors.horaFim && <p className={estilos.erro}>{errors.horaFim.message}</p>}
        </fieldset>

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className={estilos.botaoSecundario} onClick={onFechar}>Cancelar</button>
          <button type="submit" className={estilos.botaoPrimario} disabled={isSubmitting}>
            {isSubmitting ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
