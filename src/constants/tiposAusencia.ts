export const TIPOS_AUSENCIA = {
  ferias: "Férias",
  folga: "Folga",
  consulta: "Consulta médica",
  licenca: "Licença médica",
  outro: "Outro",
} as const;

export type TipoAusencia = keyof typeof TIPOS_AUSENCIA;

export const CHAVES_TIPO = Object.keys(TIPOS_AUSENCIA) as [
  TipoAusencia,
  ...TipoAusencia[],
];

/** Tipos disponíveis no modal do dia. Férias só podem ser marcadas pelo botão "Marcar férias". */
export const TIPOS_DO_DIA = [
  "folga",
  "consulta",
  "licenca",
  "outro",
] as const satisfies readonly TipoAusencia[];

/** Motivo é obrigatório apenas para o tipo "Outro". */
export const exigeMotivo = (tipo: TipoAusencia) => tipo === "outro";
