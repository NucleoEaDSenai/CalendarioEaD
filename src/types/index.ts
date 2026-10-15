import type { TipoAusencia } from '../constants/tiposAusencia';

export type Papel = 'membro' | 'lideranca';

export interface Usuario {
  nome: string;
  email: string;
  papel: Papel;
}

export interface UsuarioComId extends Usuario {
  uid: string;
}

export interface Ausencia {
  userId: string;
  nomeUsuario: string;
  /** YYYY-MM-DD */
  data: string;
  tipo: TipoAusencia;
  motivo?: string;
  diaTodo: boolean;
  horaInicio?: string;
  horaFim?: string;
  criadoPor: string;
  criadoEm: number;
}

export interface AusenciaComId extends Ausencia {
  id: string;
}

export type TipoFeriado = 'nacional' | 'estadual' | 'municipal' | 'outro';

export interface Feriado {
  nome: string;
  tipo: TipoFeriado;
}

/** Espelha o nó raiz `calendarioEAD` do plano original (Realtime Database). */
export interface BancoCalendario {
  calendarioEAD: {
    usuarios: Record<string, Usuario>;
    ausencias: Record<string, Ausencia>;
    feriados: Record<string, Feriado>;
  };
}

/** Dados que o cliente envia para criar/editar uma ausência. */
export interface AusenciaEntrada {
  userId: string;
  data: string;
  tipo: TipoAusencia;
  motivo?: string;
  diaTodo: boolean;
  horaInicio?: string;
  horaFim?: string;
}
