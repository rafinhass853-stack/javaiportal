// ============================================
// APP.JSX - VERSÃO MELHORADA E CORRIGIDA
// ============================================
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import Login from './Login';
import Menu from './Menu';

// ============================================
// COMPONENTE: LoadingScreen
// ============================================
function LoadingScreen() {
  return (
    <div className="app-loading">
      <div className="app-loading-content">
        <div className="app-loading-logo">🍽️</div>
        <div className="app-loading-spinner"></div>
        <p className="app-loading-text">Carregando Ja Vai...</p>
        <p className="app-loading-sub">Sistema de gestão de entregas</p>
      </div>
      <style>{`
        .app-loading {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          width: 100%;
          background: linear-gradient(135deg, #fdf6f0 0%, #fce8e0 50%, #fdf3e8 100%);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }

        .app-loading-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          padding: 40px;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.06);
          animation: fadeUp 0.6s ease-out;
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .app-loading-logo {
          font-size: 48px;
          background: linear-gradient(135deg, #FBC02D, #F9A825);
          width: 80px;
          height: 80px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 32px rgba(251, 192, 45, 0.3);
        }

        .app-loading-spinner {
          width: 48px;
          height: 48px;
          border: 4px solid rgba(229, 57, 53, 0.08);
          border-top-color: #E53935;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .app-loading-text {
          font-size: 20px;
          font-weight: 700;
          color: #212121;
          margin: 0;
        }

        .app-loading-sub {
          font-size: 14px;
          color: #9E9E9E;
          margin: -8px 0 0 0;
        }
      `}</style>
    </div>
  );
}

// ============================================
// COMPONENTE: ProtectedRoute
// ============================================
function ProtectedRoute({ usuario, children }) {
  if (!usuario) {
    return <Navigate to="/" replace />;
  }
  return children;
}

// ============================================
// COMPONENTE PRINCIPAL: App
// ============================================
function App() {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        if (mounted) {
          setUsuario(user);
          setCarregando(false);
          setAuthError(null);
        }
      },
      (error) => {
        if (mounted) {
          console.error('Erro de autenticação:', error);
          setAuthError(error.message);
          setCarregando(false);
        }
      }
    );

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // Mostra loading com estilo melhorado
  if (carregando) {
    return <LoadingScreen />;
  }

  // Se houver erro de autenticação, ainda tenta renderizar
  if (authError) {
    console.warn('Erro de autenticação:', authError);
  }

  return (
    <Router>
      <Routes>
        {/* Rota de Login - Sempre acessível */}
        <Route 
          path="/" 
          element={
            usuario ? <Menu /> : <Login onLogin={() => setUsuario(auth.currentUser)} />
          } 
        />

        {/* Rota com Slug do Restaurante */}
        <Route 
          path="/:restauranteSlug" 
          element={
            usuario ? (
              <Menu />
            ) : (
              <Login onLogin={() => setUsuario(auth.currentUser)} />
            )
          } 
        />

        {/* Rota de fallback - redireciona para home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;