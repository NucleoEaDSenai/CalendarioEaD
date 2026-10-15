import { CalendarDays } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { estilos } from '../components/Modal';
import { useAuth } from '../contexts/AuthContext';

export function Login() {
  const { entrar, cadastrar } = useAuth();
  const [modo, setModo] = useState<'entrar' | 'cadastro'>('entrar');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      if (modo === 'entrar') await entrar(email);
      else await cadastrar(nome, email);
    } catch (err) {
      setErro((err as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <form onSubmit={enviar} className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-2 text-lg font-semibold text-slate-900">
          <CalendarDays className="size-6 text-sky-600" /> Calendário EAD
        </div>

        <div className="mb-5 grid grid-cols-2 rounded-lg bg-slate-100 p-1 text-sm">
          {(['entrar', 'cadastro'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setModo(m)}
              className={`rounded-md py-1.5 font-medium ${modo === m ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            >
              {m === 'entrar' ? 'Entrar' : 'Primeiro acesso'}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          {modo === 'cadastro' && (
            <div>
              <label className={estilos.rotulo} htmlFor="nome">Nome</label>
              <input id="nome" className={estilos.campo} value={nome} onChange={(e) => setNome(e.target.value)} required maxLength={100} />
            </div>
          )}
          <div>
            <label className={estilos.rotulo} htmlFor="email">E-mail</label>
            <input id="email" type="email" className={estilos.campo} value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          {erro && <p className={estilos.erro} role="alert">{erro}</p>}
          <button type="submit" className={estilos.botaoPrimario} disabled={enviando}>
            {enviando ? 'Aguarde…' : modo === 'entrar' ? 'Entrar' : 'Criar acesso'}
          </button>
        </div>

        <p className="mt-5 text-xs text-slate-400">
          Login provisório por e-mail, sem senha, enquanto o Firebase Auth não é integrado.
        </p>
      </form>
    </main>
  );
}
