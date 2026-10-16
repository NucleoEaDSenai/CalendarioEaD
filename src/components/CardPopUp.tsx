import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { formatarDia } from "../lib/datas";
import { excluirAusencia } from "../services/ausencias";
import type { AusenciaComId } from "../types";
import { CardAusencia } from "./CardAusencia";
import { useToast } from "./Toaster";

/**
 * Pop-up central com as ausências do dia.
 * Fundo desfocado ocupando a tela; clicar fora do card (ou Esc) fecha tudo.
 */
export function CardPopUp({
  aberto,
  dia,
  ausencias,
  onFechar,
  onEditar,
}: {
  aberto: boolean;
  dia: Date;
  ausencias: AusenciaComId[];
  onFechar: () => void;
  onEditar: (a: AusenciaComId) => void;
}) {
  const { user, isLideranca } = useAuth();
  const avisar = useToast();
  const qtd = ausencias.length;

  const excluir = async (a: AusenciaComId) => {
    if (!confirm(`Excluir a ausência de ${a.nomeUsuario}?`)) return;
    try {
      await excluirAusencia(a.id);
      avisar("Ausência excluída");
    } catch (e) {
      avisar((e as Error).message, "erro");
    }
  };

  return (
    <Dialog.Root open={aberto} onOpenChange={(v) => !v && onFechar()}>
      <Dialog.Portal>
        <Dialog.Overlay className="popup-fundo fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm" />
        <Dialog.Content
          aria-describedby={undefined}
          className="popup-card fixed top-1/2 left-1/2 z-40 flex max-h-[85vh] w-fit max-w-[min(92vw,32rem)] min-w-[min(92vw,20rem)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl bg-white shadow-2xl focus:outline-none"
        >
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 pt-4 pb-3">
            <div>
              <Dialog.Title className="text-base font-semibold text-slate-900 capitalize">
                {formatarDia(dia, "EEEE, d 'de' MMMM")}
              </Dialog.Title>
              <p className="text-sm text-slate-500">
                {qtd} ausente{qtd !== 1 ? "s" : ""}
              </p>
            </div>
            <Dialog.Close
              className="rounded-md p-1 text-slate-500 hover:bg-slate-100"
              aria-label="Fechar"
            >
              <X className="size-5" />
            </Dialog.Close>
          </div>

          <ul className="flex flex-col gap-2 overflow-y-auto p-4">
            {ausencias.map((a) => (
              <CardAusencia
                key={a.id}
                ausencia={a}
                podeGerenciar={isLideranca || a.userId === user?.uid}
                onEditar={() => {
                  onFechar();
                  onEditar(a);
                }}
                onExcluir={() => excluir(a)}
              />
            ))}
          </ul>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
