import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import Login from './Login';
import Menu from './Menu';

function LoadingScreen() {
  return (
    <main className="app-loading" aria-live="polite" aria-busy="true">
      <section className="app-loading-content" aria-label="Carregando aplicação">
        <div className="app-loading-logo" aria-hidden="true">🍽️</div>
        <div className="app-loading-spinner" aria-hidden="true" />
        <p className="app-loading-text">Carregando o Ja Vai</p>
        <p className="app-loading-sub">Preparando seu painel de entregas</p>
      </section>
    </main>
  );
}

function AuthErrorScreen({ onRetry }) {
  return (
    <main className="auth-error-screen">
      <section className="auth-error-card" role="alert">
        <div className="app-loading-logo" aria-hidden="true">⚠️</div>
        <h1>Não foi possível conectar</h1>
        <p>Verifique sua conexão e tente carregar o painel novamente.</p>
        <button type="button" onClick={onRetry}>Tentar novamente</button>
      </section>
    </main>
  );
}

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [authKey, setAuthKey] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setUsuario(user);
        setCarregando(false);
      },
      (error) => {
        console.error('Erro de autenticação:', error);
        setUsuario(null);
        setCarregando(false);
        setAuthError(true);
      },
    );

    return unsubscribe;
  }, [authKey]);

  if (carregando) return <LoadingScreen />;
  if (authError) return <AuthErrorScreen onRetry={() => { setCarregando(true); setAuthError(false); setAuthKey((key) => key + 1); }} />;

  return (
    <Router>
      <Routes>
        <Route path="/" element={usuario ? <Menu /> : <Login />} />
        <Route path="/:restauranteSlug" element={usuario ? <Menu /> : <Login />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
