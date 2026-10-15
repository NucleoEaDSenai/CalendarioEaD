import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CircleAlert, CircleCheck } from 'lucide-react';

type Aviso = { id: number; texto: string; tipo: 'ok' | 'erro' };
const ToastContext = createContext<(texto: string, tipo?: Aviso['tipo']) => void>(() => {});

export function Toaster({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([]);

  const avisar = useCallback((texto: string, tipo: Aviso['tipo'] = 'ok') => {
    const id = Date.now() + Math.random();
    setAvisos((a) => [...a, { id, texto, tipo }]);
    setTimeout(() => setAvisos((a) => a.filter((x) => x.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={avisar}>
      {children}
      <div aria-live="polite" className="fixed bottom-4 left-1/2 z-50 flex w-[min(92vw,24rem)] -translate-x-1/2 flex-col gap-2">
        {avisos.map((a) => (
          <div
            key={a.id}
            role={a.tipo === 'erro' ? 'alert' : 'status'}
            className={`flex items-start gap-2 rounded-lg px-4 py-3 text-sm text-white shadow-lg ${
              a.tipo === 'erro' ? 'bg-red-600' : 'bg-slate-900'
            }`}
          >
            {a.tipo === 'erro' ? <CircleAlert className="mt-0.5 size-4 shrink-0" /> : <CircleCheck className="mt-0.5 size-4 shrink-0" />}
            {a.texto}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
