// ============================================
// MENU.JSX - VERSÃO MELHORADA
// ============================================
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth } from './firebase';
import Chamar from './Chamar';
import MeusDados from './MeusDados';

export default function Menu() {
  const { restauranteSlug } = useParams();
  const navigate = useNavigate();
  const [aba, setAba] = useState('chamar');
  const [usuario, setUsuario] = useState(null);
  const [menuAberto, setMenuAberto] = useState(false);
  
  // Pega o usuário atual
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUsuario(user);
    });
    return unsubscribe;
  }, []);

  const estabelecimentoId = usuario?.uid;
  
  const estabelecimentoNome = restauranteSlug 
    ? restauranteSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    : usuario?.displayName || 'Restaurante';

  // Logout com confirmação
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

  // Fecha menu ao mudar de aba (mobile)
  const handleAbaChange = (aba) => {
    setAba(aba);
    setMenuAberto(false);
  };

  return (
    <div className="menu-container">
      {/* Fundo com gradiente */}
      <div className="menu-background">
        <div className="bg-blob bg-blob-1"></div>
        <div className="bg-blob bg-blob-2"></div>
        <div className="bg-blob bg-blob-3"></div>
      </div>

      {/* Header */}
      <header className="menu-header">
        <div className="header-left">
          <button 
            className="header-menu-toggle"
            onClick={() => setMenuAberto(!menuAberto)}
            aria-label="Toggle menu"
          >
            <span className="menu-toggle-icon">☰</span>
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

      {/* Conteúdo principal */}
      <div className="menu-content">
        {/* Sidebar */}
        <aside className={`menu-sidebar ${menuAberto ? 'open' : ''}`}>
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

          {/* Versão do sistema no mobile */}
          <div className="sidebar-version">v2.0</div>
        </aside>

        {/* Overlay para fechar menu no mobile */}
        {menuAberto && (
          <div 
            className="menu-overlay"
            onClick={() => setMenuAberto(false)}
          />
        )}

        {/* Área de conteúdo */}
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
                // Atualiza o nome no header se necessário
                if (dados?.nome) {
                  // O header será atualizado na próxima renderização
                }
              }}
            />
          ) : (
            <div className="empty-state">
              <span className="empty-icon">📋</span>
              <p className="empty-text">Histórico de pedidos em breve</p>
              <p className="empty-sub">Acompanhe todas as entregas realizadas</p>
            </div>
          )}
        </main>
      </div>

      <style>{`
        /* ============================================ */
        /* MENU - ESTILOS MELHORADOS                   */
        /* ============================================ */
        
        .menu-container {
          min-height: 100vh;
          width: 100%;
          position: relative;
          overflow: hidden;
          background: #faf5f0;
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
          padding: 16px 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 2px 20px rgba(0, 0, 0, 0.04);
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .header-menu-toggle {
          display: none;
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          padding: 4px 8px;
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
          width: 40px;
          height: 40px;
          border-radius: 12px;
          font-size: 20px;
          box-shadow: 0 4px 12px rgba(251, 192, 45, 0.25);
        }

        .header-title {
          font-size: 22px;
          margin: 0;
          font-weight: 700;
          background: linear-gradient(135deg, #E53935, #C62828);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .header-badge {
          font-size: 13px;
          color: #757575;
          background: rgba(229, 57, 53, 0.08);
          padding: 4px 14px;
          border-radius: 20px;
          border: 1px solid rgba(229, 57, 53, 0.1);
          font-weight: 500;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .header-user {
          color: #757575;
          font-size: 14px;
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
          padding: 6px 18px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .header-logout:hover {
          background: #E53935;
          color: #fff;
          border-color: #E53935;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(229, 57, 53, 0.2);
        }

        /* ============================================ */
        /* CONTEÚDO PRINCIPAL                           */
        /* ============================================ */
        .menu-content {
          position: relative;
          z-index: 1;
          display: flex;
          padding: 24px;
          gap: 24px;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
          flex: 1;
          min-height: calc(100vh - 80px);
        }

        /* Overlay para mobile */
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
          width: 200px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex-shrink: 0;
          position: relative;
          z-index: 11;
        }

        .sidebar-version {
          margin-top: auto;
          padding: 12px 18px;
          font-size: 11px;
          color: #BDBDBD;
          text-align: center;
          border-top: 1px solid rgba(0, 0, 0, 0.04);
        }

        .sidebar-btn {
          padding: 14px 18px;
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 12px;
          font-size: 14px;
          font-weight: 500;
          color: #424242;
          cursor: pointer;
          text-align: left;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .sidebar-btn:hover:not(.active) {
          background: rgba(255, 255, 255, 0.9);
          border-color: rgba(229, 57, 53, 0.2);
          transform: translateX(4px);
        }

        .sidebar-btn.active {
          background: linear-gradient(135deg, #E53935, #C62828);
          color: #fff;
          border-color: #E53935;
          box-shadow: 0 4px 16px rgba(229, 57, 53, 0.25);
        }

        .btn-icon {
          font-size: 18px;
        }

        /* Área principal */
        .menu-main {
          flex: 1;
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
          min-height: 500px;
          overflow: hidden;
          position: relative;
          z-index: 1;
        }

        /* Estado vazio */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 20px;
          min-height: 400px;
        }

        .empty-icon {
          font-size: 64px;
          display: block;
          margin-bottom: 16px;
          opacity: 0.6;
        }

        .empty-text {
          color: #9E9E9E;
          font-size: 18px;
          margin: 0 0 4px 0;
          font-weight: 500;
        }

        .empty-sub {
          color: #BDBDBD;
          font-size: 14px;
          margin: 0;
        }

        /* ============================================ */
        /* RESPONSIVO                                   */
        /* ============================================ */
        @media (max-width: 1024px) {
          .menu-content {
            padding: 20px;
            gap: 20px;
          }
        }

        @media (max-width: 768px) {
          .menu-header {
            padding: 12px 16px;
          }

          .header-menu-toggle {
            display: block;
          }

          .header-right {
            gap: 8px;
          }

          .header-user {
            font-size: 12px;
            max-width: 100px;
          }

          .header-title {
            font-size: 18px;
          }

          .header-badge {
            font-size: 11px;
            padding: 2px 10px;
          }

          .menu-content {
            flex-direction: column;
            padding: 12px;
            gap: 12px;
          }

          .menu-overlay {
            display: block;
          }

          .menu-sidebar {
            position: fixed;
            top: 0;
            left: -280px;
            width: 260px;
            height: 100vh;
            background: rgba(255, 255, 255, 0.98);
            backdrop-filter: blur(20px);
            padding: 20px 16px;
            box-shadow: 4px 0 30px rgba(0, 0, 0, 0.1);
            transition: left 0.3s ease;
            gap: 6px;
            z-index: 20;
          }

          .menu-sidebar.open {
            left: 0;
          }

          .sidebar-btn {
            padding: 12px 16px;
            font-size: 14px;
            background: transparent;
            border: none;
            border-radius: 10px;
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
            margin-top: auto;
            padding: 16px 16px 8px;
            font-size: 11px;
            color: #BDBDBD;
          }

          .menu-main {
            min-height: 400px;
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

          .empty-state {
            padding: 60px 16px;
            min-height: 300px;
          }
        }

        @media (max-width: 480px) {
          .menu-header {
            padding: 10px 12px;
          }

          .header-user {
            display: none;
          }

          .header-logout {
            font-size: 12px;
            padding: 4px 14px;
          }

          .menu-content {
            padding: 8px;
            gap: 8px;
          }

          .menu-main {
            min-height: 300px;
            border-radius: 12px;
          }

          .empty-state {
            padding: 40px 16px;
            min-height: 250px;
          }

          .empty-icon {
            font-size: 48px;
          }

          .empty-text {
            font-size: 16px;
          }

          .menu-sidebar {
            width: 240px;
            left: -260px;
            padding: 16px 12px;
          }

          .sidebar-btn {
            padding: 10px 14px;
            font-size: 13px;
          }

          .btn-icon {
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  );
}