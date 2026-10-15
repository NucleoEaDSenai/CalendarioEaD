import { Toaster } from './components/Toaster';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CalendarioPage } from './pages/CalendarioPage';
import { Login } from './pages/Login';

function Rotas() {
  const { user, carregando } = useAuth();
  if (carregando) return <p className="p-6 text-sm text-slate-500">Carregando…</p>;
  return user ? <CalendarioPage /> : <Login />;
}

export default function App() {
  return (
    <Toaster>
      <AuthProvider>
        <Rotas />
      </AuthProvider>
    </Toaster>
  );
}
