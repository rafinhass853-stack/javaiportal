// ============================================
// MENU.JSX - VERSÃO TELA CHEIA - FONTES OTIMIZADAS
// ============================================
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth, onAuthStateChanged } from './firebase';
import Historico from './Historico';
import Chamar from './chamar';
import MeusDados from './MeusDados';

export default function Menu() {
  const { restauranteSlug } = useParams();
  const navigate = useNavigate();
  const [aba, setAba] = useState('chamar');
  const [usuario, setUsuario] = useState(null);
  const [menuAberto, setMenuAberto] = useState(false);
  const [nomeExibicao, setNomeExibicao] = useState('Restaurante');
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUsuario(user);
      setNomeExibicao(user?.displayName || 'Restaurante');
    });
    return unsubscribe;
  }, []);

  const estabelecimentoId = usuario?.uid;
  
  const estabelecimentoNome = restauranteSlug 
    ? restauranteSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    : nomeExibicao;

  const handleLogout = async () => {
    if (window.confirm('Tem certeza que deseja sair?')) {
      try {
        await auth.signOut();
        navigate('/');
      } catch (error) {
        console.error('Erro ao sair:', error);
      }
    }
  };

  const handleAbaChange = (aba) => {
    setAba(aba);
    setMenuAberto(false);
  };

  return (
    <div className="menu-container">
      <div className="menu-background">
        <div className="bg-blob bg-blob-1"></div>
        <div className="bg-blob bg-blob-2"></div>
        <div className="bg-blob bg-blob-3"></div>
      </div>

      <header className="menu-header">
        <div className="header-left">
          <button 
            className="header-menu-toggle"
            onClick={() => setMenuAberto(!menuAberto)}
            aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={menuAberto}
            aria-controls="menu-navegacao"
          >
            <span className="menu-toggle-icon" aria-hidden="true">☰</span>
          </button>
          <div className="header-logo">🍽️</div>
          <h1 className="header-title">Ja Vai</h1>
          {restauranteSlug && (
            <span className="header-badge">
              {estabelecimentoNome}
            </span>
          )}
        </div>
        <div className="header-right">
          <span className="header-user">
            👤 {estabelecimentoNome}
          </span>
          <button
            onClick={handleLogout}
            className="header-logout"
            title="Sair"
          >
            Sair
          </button>
        </div>
      </header>

      <div className="menu-content">
        <aside id="menu-navegacao" className={`menu-sidebar ${menuAberto ? 'open' : ''}`} aria-label="Navegação principal">
          <button
            onClick={() => handleAbaChange('chamar')}
            className={`sidebar-btn ${aba === 'chamar' ? 'active' : ''}`}
          >
            <span className="btn-icon">📦</span>
            Chamar
          </button>
          <button
            onClick={() => handleAbaChange('meus-dados')}
            className={`sidebar-btn ${aba === 'meus-dados' ? 'active' : ''}`}
          >
            <span className="btn-icon">⚙️</span>
            Meus Dados
          </button>
          <button
            onClick={() => handleAbaChange('historico')}
            className={`sidebar-btn ${aba === 'historico' ? 'active' : ''}`}
          >
            <span className="btn-icon">📋</span>
            Histórico
          </button>

          <div className="sidebar-version">v2.0</div>
        </aside>

        {menuAberto && (
          <div 
            className="menu-overlay"
            onClick={() => setMenuAberto(false)}
          />
        )}

        <main className="menu-main">
          {aba === 'chamar' ? (
            <Chamar 
              estabelecimentoId={estabelecimentoId} 
              estabelecimentoNome={estabelecimentoNome} 
              restauranteSlug={restauranteSlug}
            />
          ) : aba === 'meus-dados' ? (
            <MeusDados 
              estabelecimentoId={estabelecimentoId}
              onDadosSalvos={(dados) => {
                if (dados?.nome) setNomeExibicao(dados.nome);
              }}
            />
          ) : (
            <Historico estabelecimentoId={estabelecimentoId} />
          )}
        </main>
      </div>

      <style>{`
        /* ============================================ */
        /* MENU - TELA CHEIA - FONTES OTIMIZADAS       */
        /* ============================================ */
        
        .menu-container {
          min-height: 100vh;
          min-height: 100dvh;
          width: 100%;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
          background: #faf5f0;
          margin: 0;
          padding: 0;
        }

        /* Fundo */
        .menu-background {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 0;
          background: linear-gradient(135deg, #fdf6f0 0%, #fce8e0 50%, #fdf3e8 100%);
        }

        .bg-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.3;
          animation: floatBlob 20s ease-in-out infinite;
        }

        .bg-blob-1 {
          width: 500px;
          height: 500px;
          top: -150px;
          right: -100px;
          background: radial-gradient(circle, #E53935, transparent 70%);
          animation-delay: 0s;
        }

        .bg-blob-2 {
          width: 400px;
          height: 400px;
          bottom: -100px;
          left: -100px;
          background: radial-gradient(circle, #FBC02D, transparent 70%);
          animation-delay: -5s;
        }

        .bg-blob-3 {
          width: 300px;
          height: 300px;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: radial-gradient(circle, #FF6B35, transparent 70%);
          opacity: 0.12;
          animation-delay: -10s;
          animation-duration: 25s;
        }

        @keyframes floatBlob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }

        /* ============================================ */
        /* HEADER                                       */
        /* ============================================ */
        .menu-header {
          position: relative;
          z-index: 2;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          padding: 12px 28px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 1px 12px rgba(0, 0, 0, 0.04);
          flex-shrink: 0;
          width: 100%;
          box-sizing: border-box;
          min-height: 64px;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .header-menu-toggle {
          display: none;
          background: none;
          border: none;
          font-size: 22px;
          cursor: pointer;
          padding: 4px 6px;
          color: #424242;
          transition: all 0.3s ease;
        }

        .header-menu-toggle:hover {
          color: #E53935;
        }

        .menu-toggle-icon {
          display: block;
          line-height: 1;
        }

        .header-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #FBC02D, #F9A825);
          width: 36px;
          height: 36px;
          border-radius: 10px;
          font-size: 18px;
          box-shadow: 0 3px 10px rgba(251, 192, 45, 0.25);
        }

        .header-title {
          font-size: 19px;
          margin: 0;
          font-weight: 700;
          background: linear-gradient(135deg, #E53935, #C62828);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .header-badge {
          font-size: 12px;
          color: #757575;
          background: rgba(229, 57, 53, 0.08);
          padding: 3px 12px;
          border-radius: 16px;
          border: 1px solid rgba(229, 57, 53, 0.1);
          font-weight: 500;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .header-user {
          color: #757575;
          font-size: 13px;
          font-weight: 500;
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .header-logout {
          background: transparent;
          border: 1px solid rgba(229, 57, 53, 0.2);
          color: #E53935;
          padding: 5px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.3s ease;
          height: 34px;
          display: flex;
          align-items: center;
        }

        .header-logout:hover {
          background: #E53935;
          color: #fff;
          border-color: #E53935;
          transform: translateY(-1px);
          box-shadow: 0 3px 10px rgba(229, 57, 53, 0.2);
        }

        /* ============================================ */
        /* CONTEÚDO PRINCIPAL - TELA CHEIA             */
        /* ============================================ */
        .menu-content {
          position: relative;
          z-index: 1;
          display: flex;
          padding: 20px 28px;
          gap: 20px;
          width: 100%;
          flex: 1;
          min-height: calc(100vh - 64px);
          min-height: calc(100dvh - 64px);
          box-sizing: border-box;
          margin: 0;
        }

        .menu-overlay {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.3);
          z-index: 10;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* Sidebar */
        .menu-sidebar {
          width: 180px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex-shrink: 0;
          position: relative;
          z-index: 11;
        }

        .sidebar-version {
          margin-top: auto;
          padding: 10px 14px;
          font-size: 10px;
          color: #BDBDBD;
          text-align: center;
          border-top: 1px solid rgba(0, 0, 0, 0.04);
        }

        .sidebar-btn {
          padding: 11px 16px;
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 10px;
          font-size: 13px;
          font-weight: 500;
          color: #424242;
          cursor: pointer;
          text-align: left;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 1px 6px rgba(0, 0, 0, 0.04);
          min-height: 44px;
        }

        .sidebar-btn:hover:not(.active) {
          background: rgba(255, 255, 255, 0.9);
          border-color: rgba(229, 57, 53, 0.2);
          transform: translateX(3px);
        }

        .sidebar-btn.active {
          background: linear-gradient(135deg, #E53935, #C62828);
          color: #fff;
          border-color: #E53935;
          box-shadow: 0 3px 12px rgba(229, 57, 53, 0.25);
        }

        .btn-icon {
          font-size: 16px;
        }

        /* Área principal */
        .menu-main {
          flex: 1;
          min-width: 0;
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 2px 16px rgba(0, 0, 0, 0.04);
          min-height: 500px;
          overflow: hidden;
          position: relative;
          z-index: 1;
        }

        /* ============================================ */
        /* RESPONSIVO - TELA CHEIA                     */
        /* ============================================ */
        @media (max-width: 1024px) {
          .menu-content {
            padding: 16px 20px;
            gap: 16px;
          }
        }

        @media (max-width: 768px) {
          .menu-header {
            padding: 10px 14px;
            min-height: 56px;
          }

          .menu-content {
            padding: 12px;
            gap: 0;
            min-height: calc(100vh - 56px);
            min-height: calc(100dvh - 56px);
          }

          .header-menu-toggle {
            display: block;
          }

          .header-right {
            gap: 6px;
          }

          .header-user {
            font-size: 12px;
            max-width: 90px;
          }

          .header-title {
            font-size: 17px;
          }

          .header-badge {
            font-size: 10px;
            padding: 2px 8px;
          }

          .header-logo {
            width: 32px;
            height: 32px;
            font-size: 16px;
          }

          .header-logout {
            font-size: 12px;
            padding: 4px 12px;
            height: 30px;
          }

          .menu-overlay {
            display: block;
          }

          .menu-sidebar {
            position: fixed;
            top: 0;
            left: -280px;
            width: 250px;
            height: 100vh;
            height: 100dvh;
            background: rgba(255, 255, 255, 0.98);
            backdrop-filter: blur(20px);
            padding: 16px 14px;
            box-shadow: 3px 0 24px rgba(0, 0, 0, 0.1);
            transition: left 0.3s ease;
            gap: 4px;
            z-index: 20;
          }

          .menu-sidebar.open {
            left: 0;
          }

          .sidebar-btn {
            padding: 10px 14px;
            font-size: 13px;
            background: transparent;
            border: none;
            border-radius: 8px;
            min-height: 40px;
          }

          .sidebar-btn:hover:not(.active) {
            transform: none;
            background: rgba(229, 57, 53, 0.05);
          }

          .sidebar-btn.active {
            background: linear-gradient(135deg, #E53935, #C62828);
            color: #fff;
          }

          .sidebar-version {
            padding: 12px 14px 6px;
            font-size: 10px;
          }

          .menu-main {
            min-height: 350px;
            border-radius: 12px;
          }

          .bg-blob-1 {
            width: 300px;
            height: 300px;
            top: -100px;
            right: -50px;
          }

          .bg-blob-2 {
            width: 250px;
            height: 250px;
            bottom: -50px;
            left: -50px;
          }
        }

        @media (max-width: 480px) {
          .menu-header {
            padding: 8px 10px;
            min-height: 48px;
          }

          .menu-content {
            padding: 6px;
            min-height: calc(100vh - 48px);
            min-height: calc(100dvh - 48px);
          }

          .header-user {
            display: none;
          }

          .header-title {
            font-size: 15px;
          }

          .header-logo {
            width: 28px;
            height: 28px;
            font-size: 14px;
            border-radius: 8px;
          }

          .header-logout {
            font-size: 11px;
            padding: 3px 10px;
            height: 26px;
          }

          .header-badge {
            font-size: 9px;
            padding: 1px 6px;
          }

          .menu-main {
            min-height: 250px;
            border-radius: 10px;
          }

          .menu-sidebar {
            width: 220px;
            left: -240px;
            padding: 12px 10px;
          }

          .sidebar-btn {
            padding: 8px 12px;
            font-size: 12px;
            min-height: 36px;
          }

          .btn-icon {
            font-size: 14px;
          }

          .sidebar-version {
            font-size: 9px;
          }
        }
      `}</style>
    </div>
  );
}