import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, assinar, ErroApi, sessao } from '../lib/api';
import type { UsuarioComId } from '../types';

interface AuthValor {
  user: { uid: string } | null;
  perfil: UsuarioComId | null;
  isLideranca: boolean;
  carregando: boolean;
  entrar: (email: string) => Promise<void>;
  cadastrar: (nome: string, email: string) => Promise<void>;
  sair: () => void;
}

const AuthContext = createContext<AuthValor | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [perfil, setPerfil] = useState<UsuarioComId | null>(null);
  const [carregando, setCarregando] = useState(true);

  const recarregarPerfil = useCallback(async () => {
    const uid = sessao.uid;
    if (!uid) {
      setPerfil(null);
      return;
    }
    try {
      setPerfil(await api<UsuarioComId>(`/usuarios/${uid}`));
    } catch (e) {
      if (e instanceof ErroApi && (e.status === 401 || e.status === 404)) {
        sessao.uid = null;
        setPerfil(null);
      }
    }
  }, []);

  useEffect(() => {
    recarregarPerfil().finally(() => setCarregando(false));
    return assinar('usuarios', recarregarPerfil);
  }, [recarregarPerfil]);

  const entrar = async (email: string) => {
    const u = await api<UsuarioComId>('/login', { metodo: 'POST', corpo: { email } });
    sessao.uid = u.uid;
    setPerfil(u);
  };

  const cadastrar = async (nome: string, email: string) => {
    const u = await api<UsuarioComId>('/usuarios', { metodo: 'POST', corpo: { nome, email } });
    sessao.uid = u.uid;
    setPerfil(u);
  };

  const sair = () => {
    sessao.uid = null;
    setPerfil(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user: perfil ? { uid: perfil.uid } : null,
        perfil,
        isLideranca: perfil?.papel === 'lideranca',
        carregando,
        entrar,
        cadastrar,
        sair,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>');
  return ctx;
}
