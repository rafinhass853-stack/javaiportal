// ============================================
// LOGIN.JSX - VERSÃO MELHORADA
// ============================================
import { useState, useEffect, useRef } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [tentativas, setTentativas] = useState(0);
  const inputRef = useRef(null);

  // Foca no input de email ao carregar
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validação básica
    if (!email.trim() || !senha.trim()) {
      setErro('Preencha todos os campos');
      return;
    }

    setCarregando(true);
    setErro('');

    try {
      await signInWithEmailAndPassword(auth, email, senha);
      setTentativas(0);
      if (onLogin) onLogin();
    } catch (error) {
      console.error('Erro no login:', error);
      setTentativas(prev => prev + 1);
      
      // Mensagens mais amigáveis
      const mensagens = {
        'auth/user-not-found': '❌ Nenhuma conta encontrada com este e-mail',
        'auth/wrong-password': '❌ Senha incorreta. Tente novamente',
        'auth/invalid-email': '❌ E-mail inválido. Verifique o formato',
        'auth/too-many-requests': '⏳ Muitas tentativas. Aguarde alguns minutos',
        'auth/network-request-failed': '🌐 Erro de conexão. Verifique sua internet',
      };
      
      setErro(mensagens[error.code] || '❌ E-mail ou senha inválidos');
    } finally {
      setCarregando(false);
    }
  };

  // Limpa erro ao digitar
  const handleChange = (setter) => (e) => {
    setter(e.target.value);
    if (erro) setErro('');
  };

  return (
    <div className="login-layout">
      {/* Lado Esquerdo: Arte */}
      <div className="login-art-side">
        <div className="art-overlay" />
        <div className="art-content">
          <div className="art-badge">🍽️</div>
          <p className="art-title">Bem-vindo ao</p>
          <h1 className="art-brand">Ja Vai</h1>
          <p className="art-description">
            Sistema inteligente de gestão de entregas para restaurantes
          </p>
          <div className="art-features">
            <div className="feature-item">
              <span>📦</span>
              <span>Roteirização automática</span>
            </div>
            <div className="feature-item">
              <span>📍</span>
              <span>Mapa em tempo real</span>
            </div>
            <div className="feature-item">
              <span>🚀</span>
              <span>Entregas otimizadas</span>
            </div>
          </div>
        </div>
        <img 
          src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200&auto=format&fit=crop" 
          alt="Restaurante" 
          className="art-image"
        />
      </div>

      {/* Lado Direito: Formulário */}
      <div className="login-form-side">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo-box">🍽️</div>
            <h1 className="login-title">Ja Vai</h1>
            <p className="login-subtitle">Painel do Restaurante</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form" noValidate>
            <div className="form-group">
              <label className="form-label">E-mail</label>
              <div className="input-wrapper">
                <input
                  ref={inputRef}
                  type="email"
                  value={email}
                  onChange={handleChange(setEmail)}
                  placeholder="seu@email.com"
                  className={`form-input ${erro ? 'error' : ''}`}
                  disabled={carregando}
                  autoComplete="email"
                  spellCheck={false}
                />
                <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9E9E9E" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Senha</label>
              <div className="input-wrapper">
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={handleChange(setSenha)}
                  placeholder="••••••••"
                  className={`form-input ${erro ? 'error' : ''}`}
                  disabled={carregando}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="toggle-password"
                  tabIndex="-1"
                >
                  {mostrarSenha ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {erro && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                <span>{erro}</span>
              </div>
            )}

            {tentativas >= 3 && (
              <div className="warning-message">
                <span>🔒</span>
                <span>Muitas tentativas? Aguarde um momento e tente novamente</span>
              </div>
            )}

            <button
              type="submit"
              disabled={carregando}
              className="login-button"
            >
              {carregando ? (
                <>
                  <span className="btn-spinner"></span>
                  Entrando...
                </>
              ) : (
                '🚀 Entrar'
              )}
            </button>

            <div className="forgot-container">
              <a href="#recuperar" className="forgot-link">
                Esqueci minha senha
              </a>
            </div>
          </form>

          <div className="login-footer">
            <span className="footer-icon">✦</span>
            <span>v2.0 • Gestão de Entregas</span>
            <span className="footer-icon heart">❤</span>
          </div>
        </div>
      </div>

      <style>{`
        /* ============================================ */
        /* LOGIN - ESTILOS MELHORADOS                  */
        /* ============================================ */
        
        .login-layout {
          display: flex;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background: #faf5f0;
        }

        /* ============================================ */
        /* LADO ESQUERDO                                */
        /* ============================================ */
        .login-art-side {
          flex: 1.2;
          position: relative;
          height: 100%;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .art-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: saturate(1.1) brightness(0.8) contrast(1.05);
        }

        .art-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            135deg,
            rgba(229, 57, 53, 0.35) 0%,
            rgba(251, 192, 45, 0.15) 50%,
            rgba(0, 0, 0, 0.3) 100%
          );
          z-index: 1;
        }

        .art-content {
          position: absolute;
          z-index: 2;
          padding: 40px;
          max-width: 480px;
          color: #fff;
          text-shadow: 0 2px 20px rgba(0, 0, 0, 0.3);
        }

        .art-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          width: 64px;
          height: 64px;
          border-radius: 16px;
          font-size: 32px;
          margin-bottom: 20px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .art-title {
          font-size: 18px;
          font-weight: 400;
          margin: 0 0 4px 0;
          opacity: 0.9;
        }

        .art-brand {
          font-size: 48px;
          font-weight: 800;
          margin: 0 0 12px 0;
          letter-spacing: -1px;
          background: linear-gradient(135deg, #fff, #FBC02D);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .art-description {
          font-size: 16px;
          opacity: 0.85;
          margin: 0 0 24px 0;
          line-height: 1.6;
        }

        .art-features {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 14px;
          opacity: 0.9;
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(10px);
          padding: 10px 16px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          transition: all 0.3s ease;
        }

        .feature-item:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: translateX(4px);
        }

        .feature-item span:first-child {
          font-size: 20px;
        }

        /* ============================================ */
        /* LADO DIREITO                                */
        /* ============================================ */
        .login-form-side {
          flex: 0.9;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #faf5f0;
          padding: 40px;
          box-sizing: border-box;
        }

        .login-card {
          width: 100%;
          max-width: 400px;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 20px;
          padding: 40px 36px 32px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.06);
          display: flex;
          flex-direction: column;
          align-items: center;
          animation: fadeIn 0.5s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* ============================================ */
        /* HEADER DO LOGIN                              */
        /* ============================================ */
        .login-header {
          text-align: center;
          margin-bottom: 28px;
          width: 100%;
        }

        .login-logo-box {
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, #FBC02D, #F9A825);
          border-radius: 18px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
          font-size: 32px;
          box-shadow: 0 8px 24px rgba(251, 192, 45, 0.3);
          transition: transform 0.3s ease;
        }

        .login-logo-box:hover {
          transform: scale(1.05) rotate(-3deg);
        }

        .login-title {
          font-size: 28px;
          font-weight: 700;
          margin: 0 0 4px 0;
          background: linear-gradient(135deg, #E53935, #C62828);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .login-subtitle {
          font-size: 14px;
          color: #757575;
          margin: 0;
          font-weight: 400;
        }

        /* ============================================ */
        /* FORMULÁRIO                                   */
        /* ============================================ */
        .login-form {
          width: 100%;
        }

        .form-group {
          margin-bottom: 18px;
        }

        .form-label {
          display: block;
          font-size: 14px;
          color: #424242;
          font-weight: 500;
          margin-bottom: 6px;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .form-input {
          width: 100%;
          padding: 12px 44px 12px 14px;
          border: 2px solid rgba(229, 57, 53, 0.1);
          border-radius: 12px;
          font-size: 15px;
          color: #212121;
          background: rgba(255, 255, 255, 0.6);
          outline: none;
          box-sizing: border-box;
          transition: all 0.3s ease;
        }

        .form-input:focus {
          border-color: #E53935;
          background: rgba(255, 255, 255, 0.9);
          box-shadow: 0 0 0 4px rgba(229, 57, 53, 0.06);
        }

        .form-input.error {
          border-color: #E53935;
          background: rgba(229, 57, 53, 0.04);
        }

        .form-input::placeholder {
          color: #9E9E9E;
          opacity: 0.6;
        }

        .form-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .input-icon {
          position: absolute;
          right: 12px;
          pointer-events: none;
          opacity: 0.4;
        }

        .toggle-password {
          position: absolute;
          right: 8px;
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          padding: 4px 8px;
          opacity: 0.5;
          transition: opacity 0.3s ease;
        }

        .toggle-password:hover {
          opacity: 0.8;
        }

        /* ============================================ */
        /* MENSAGENS                                    */
        /* ============================================ */
        .error-message {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(229, 57, 53, 0.06);
          border-left: 4px solid #E53935;
          padding: 10px 14px;
          border-radius: 8px;
          margin-bottom: 16px;
          animation: shake 0.4s ease-out;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }

        .error-message span {
          color: #C62828;
          font-size: 14px;
          font-weight: 500;
        }

        .error-icon {
          font-size: 16px;
        }

        .warning-message {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(251, 192, 45, 0.08);
          border-left: 4px solid #FBC02D;
          padding: 10px 14px;
          border-radius: 8px;
          margin-bottom: 16px;
        }

        .warning-message span {
          color: #F57F17;
          font-size: 13px;
        }

        /* ============================================ */
        /* BOTÃO                                        */
        /* ============================================ */
        .login-button {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #E53935, #C62828);
          color: #FFFFFF;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 16px rgba(229, 57, 53, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .login-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(229, 57, 53, 0.35);
        }

        .login-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .login-button:disabled {
          background: #BDBDBD;
          box-shadow: none;
          cursor: not-allowed;
          opacity: 0.7;
        }

        .btn-spinner {
          display: inline-block;
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* ============================================ */
        /* LINK ESQUECI SENHA                           */
        /* ============================================ */
        .forgot-container {
          text-align: center;
          margin-top: 16px;
        }

        .forgot-link {
          font-size: 13px;
          color: #9E9E9E;
          text-decoration: none;
          transition: color 0.3s ease;
        }

        .forgot-link:hover {
          color: #E53935;
        }

        /* ============================================ */
        /* RODAPÉ                                       */
        /* ============================================ */
        .login-footer {
          margin-top: 28px;
          padding-top: 20px;
          border-top: 1px solid rgba(0, 0, 0, 0.06);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 13px;
          color: #9E9E9E;
          width: 100%;
          flex-wrap: wrap;
        }

        .footer-icon {
          color: #FBC02D;
        }

        .footer-icon.heart {
          color: #E53935;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }

        /* ============================================ */
        /* RESPONSIVO                                   */
        /* ============================================ */
        @media (max-width: 1024px) {
          .login-art-side { flex: 1; }
          .art-content { padding: 30px; }
          .art-brand { font-size: 36px; }
          .art-features { gap: 8px; }
          .feature-item { font-size: 13px; padding: 8px 14px; }
        }

        @media (max-width: 850px) {
          .login-art-side { display: none; }
          .login-form-side {
            flex: 1;
            padding: 20px;
            background: #faf5f0;
          }
          .login-card { padding: 32px 24px; border-radius: 16px; }
          .login-title { font-size: 24px; }
          .login-logo-box { width: 56px; height: 56px; font-size: 28px; }
          .form-input { font-size: 14px; padding: 10px 40px 10px 12px; }
        }

        @media (max-width: 480px) {
          .login-form-side { padding: 12px; }
          .login-card { padding: 24px 16px; }
          .login-title { font-size: 22px; }
          .login-logo-box { width: 48px; height: 48px; font-size: 24px; }
          .login-subtitle { font-size: 13px; }
          .form-input { font-size: 13px; padding: 10px 36px 10px 12px; }
          .login-button { font-size: 14px; padding: 12px; }
          .login-footer { font-size: 11px; gap: 4px; }
        }
      `}</style>
    </div>
  );
}