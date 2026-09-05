import { useEffect, useRef, useState } from 'react';
import { sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase';

const mensagensAuth = {
  'auth/user-not-found': 'Nenhuma conta foi encontrada com este e-mail.',
  'auth/wrong-password': 'Senha incorreta. Tente novamente.',
  'auth/invalid-credential': 'E-mail ou senha inválidos.',
  'auth/invalid-email': 'Informe um endereço de e-mail válido.',
  'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
  'auth/network-request-failed': 'Sem conexão com a internet. Verifique sua rede.',
};

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [recuperando, setRecuperando] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [tentativas, setTentativas] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const limparFeedback = () => {
    if (erro) setErro('');
    if (mensagem) setMensagem('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const emailNormalizado = email.trim();

    if (!emailNormalizado || !senha) {
      setErro('Preencha seu e-mail e sua senha para continuar.');
      return;
    }

    setCarregando(true);
    setErro('');
    setMensagem('');

    try {
      await signInWithEmailAndPassword(auth, emailNormalizado, senha);
      setTentativas(0);
      onLogin?.();
    } catch (error) {
      console.error('Erro no login:', error);
      setTentativas((current) => current + 1);
      setErro(mensagensAuth[error.code] || 'Não foi possível entrar. Confira seus dados e tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  const handleRecuperarSenha = async () => {
    const emailNormalizado = email.trim();
    if (!emailNormalizado) {
      setErro('Informe seu e-mail para receber o link de recuperação.');
      inputRef.current?.focus();
      return;
    }

    setRecuperando(true);
    setErro('');
    setMensagem('');

    try {
      await sendPasswordResetEmail(auth, emailNormalizado);
      setMensagem('Link de recuperação enviado. Verifique sua caixa de entrada.');
    } catch (error) {
      console.error('Erro ao recuperar senha:', error);
      setErro(mensagensAuth[error.code] || 'Não foi possível enviar o link agora.');
    } finally {
      setRecuperando(false);
    }
  };

  return (
    <main className="login-layout">
      <section className="login-art-side" aria-label="Apresentação do Ja Vai">
        <img
          src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1400&auto=format&fit=crop"
          alt="Interior acolhedor de um restaurante"
          className="art-image"
        />
        <div className="art-overlay" />
        <div className="art-content">
          <div className="art-badge" aria-hidden="true">🍽️</div>
          <p className="art-kicker">Gestão que acompanha o seu ritmo</p>
          <h1 className="art-brand">Ja Vai</h1>
          <p className="art-description">Organize as entregas do seu restaurante com clareza, agilidade e menos retrabalho.</p>
          <div className="art-features">
            <div className="feature-item"><span aria-hidden="true">✦</span><span>Rotas organizadas em poucos cliques</span></div>
            <div className="feature-item"><span aria-hidden="true">⌖</span><span>Endereços localizados no mapa</span></div>
            <div className="feature-item"><span aria-hidden="true">↗</span><span>Mais previsibilidade para cada saída</span></div>
          </div>
        </div>
      </section>

      <section className="login-form-side">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo-box" aria-hidden="true">🍽️</div>
            <p className="eyebrow">Portal do restaurante</p>
            <h2 className="login-title">Bom te ver por aqui.</h2>
            <p className="login-subtitle">Entre para continuar gerenciando suas entregas.</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form" noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">E-mail</label>
              <input
                ref={inputRef}
                id="login-email"
                type="email"
                value={email}
                onChange={(event) => { setEmail(event.target.value); limparFeedback(); }}
                placeholder="voce@seurestaurante.com"
                className={`form-input ${erro ? 'error' : ''}`}
                disabled={carregando || recuperando}
                autoComplete="email"
                spellCheck={false}
                aria-invalid={Boolean(erro)}
                required
              />
            </div>

            <div className="form-group">
              <div className="label-row">
                <label className="form-label" htmlFor="login-password">Senha</label>
                <button type="button" className="inline-action" onClick={handleRecuperarSenha} disabled={recuperando || carregando}>
                  {recuperando ? 'Enviando...' : 'Esqueci a senha'}
                </button>
              </div>
              <div className="password-wrapper">
                <input
                  id="login-password"
                  type={mostrarSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={(event) => { setSenha(event.target.value); limparFeedback(); }}
                  placeholder="Digite sua senha"
                  className={`form-input password-input ${erro ? 'error' : ''}`}
                  disabled={carregando || recuperando}
                  autoComplete="current-password"
                  aria-invalid={Boolean(erro)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha((visible) => !visible)}
                  className="toggle-password"
                  aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                  aria-pressed={mostrarSenha}
                >
                  {mostrarSenha ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </div>

            {erro && <div className="feedback feedback-error" role="alert"><span aria-hidden="true">!</span><span>{erro}</span></div>}
            {mensagem && <div className="feedback feedback-success" role="status"><span aria-hidden="true">✓</span><span>{mensagem}</span></div>}
            {tentativas >= 3 && !erro && <p className="login-hint">Se necessário, use “Esqueci a senha” para criar uma nova senha com segurança.</p>}

            <button type="submit" disabled={carregando || recuperando} className="login-button">
              {carregando ? <><span className="btn-spinner" aria-hidden="true" /> Entrando...</> : 'Entrar no painel'}
            </button>
          </form>

          <p className="login-footer"><span aria-hidden="true">✦</span> Seguro, simples e feito para o dia a dia.</p>
        </div>
      </section>

      <style>{`
        .login-layout { min-height: 100vh; display: grid; grid-template-columns: minmax(0, 1.08fr) minmax(420px, .92fr); background: #fffaf7; }
        .login-art-side { position: relative; min-height: 100vh; overflow: hidden; background: #6e2418; }
        .art-image { width: 100%; height: 100%; object-fit: cover; filter: saturate(.9) contrast(1.05); }
        .art-overlay { position: absolute; inset: 0; background: linear-gradient(135deg, rgba(80, 22, 14, .84), rgba(210, 71, 31, .28) 58%, rgba(24, 27, 29, .42)); }
        .art-content { position: absolute; z-index: 1; inset: auto 10% 10%; max-width: 560px; color: #fff; }
        .art-badge { display: grid; place-items: center; width: 64px; height: 64px; margin-bottom: 24px; color: #3a2714; background: #f5b841; border-radius: 20px; font-size: 32px; box-shadow: 0 14px 30px rgba(0,0,0,.18); }
        .art-kicker { margin: 0 0 8px; color: rgba(255,255,255,.75); font-size: 14px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
        .art-brand { margin: 0 0 16px; color: #fff; font: 700 clamp(48px, 6vw, 78px)/.95 'Space Grotesk', sans-serif; letter-spacing: -.06em; }
        .art-description { max-width: 480px; margin: 0 0 28px; color: rgba(255,255,255,.84); font-size: 18px; line-height: 1.55; }
        .art-features { display: grid; gap: 10px; }
        .feature-item { display: flex; align-items: center; gap: 12px; width: fit-content; padding: 10px 14px; color: rgba(255,255,255,.92); background: rgba(255,255,255,.10); border: 1px solid rgba(255,255,255,.16); border-radius: 12px; backdrop-filter: blur(10px); font-size: 14px; }
        .feature-item span:first-child { display: grid; place-items: center; width: 24px; height: 24px; color: #3a2714; background: #f5b841; border-radius: 8px; font-weight: 800; }
        .login-form-side { display: grid; place-items: center; padding: 48px; background: radial-gradient(circle at 15% 10%, rgba(245,184,65,.14), transparent 32%), #fffaf7; }
        .login-card { width: min(100%, 430px); padding: 42px; background: rgba(255,255,255,.88); border: 1px solid #f0e7e2; border-radius: 26px; box-shadow: 0 24px 70px rgba(81,44,31,.11); backdrop-filter: blur(18px); }
        .login-header { margin-bottom: 30px; text-align: left; }
        .login-logo-box { width: 54px; height: 54px; margin-bottom: 20px; border-radius: 17px; font-size: 26px; }
        .eyebrow { margin: 0 0 8px; color: var(--primary); font-size: 12px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
        .login-title { margin: 0 0 8px; color: var(--ink); font: 700 30px/1.1 'Space Grotesk', sans-serif; letter-spacing: -.04em; }
        .login-subtitle { margin: 0; color: var(--muted); font-size: 15px; line-height: 1.5; }
        .login-form { display: grid; gap: 18px; }
        .form-group { display: grid; gap: 8px; }
        .label-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .form-label { color: #35404a; font-size: 13px; font-weight: 700; }
        .form-input { width: 100%; min-height: 50px; padding: 0 15px; color: var(--ink); background: #fbfcfd; border: 1px solid var(--line); border-radius: 12px; outline: none; transition: .2s ease; }
        .form-input:focus { border-color: var(--primary); background: #fff; box-shadow: 0 0 0 4px rgba(228,87,46,.12); }
        .form-input.error { border-color: var(--danger); }
        .form-input:disabled { opacity: .65; }
        .password-wrapper { position: relative; }
        .password-input { padding-right: 86px; }
        .toggle-password { position: absolute; top: 50%; right: 8px; transform: translateY(-50%); padding: 8px; color: var(--muted); background: transparent; border: 0; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 800; }
        .toggle-password:hover, .inline-action:hover:not(:disabled) { color: var(--primary-dark); }
        .inline-action { padding: 0; color: var(--primary); background: none; border: 0; cursor: pointer; font-size: 12px; font-weight: 700; }
        .inline-action:disabled { opacity: .6; cursor: wait; }
        .feedback { display: flex; gap: 9px; align-items: flex-start; padding: 12px 14px; border-radius: 12px; font-size: 13px; line-height: 1.45; }
        .feedback span:first-child { display: grid; place-items: center; flex: 0 0 20px; height: 20px; color: #fff; border-radius: 50%; font-weight: 800; }
        .feedback-error { color: #8f2727; background: #fff1f1; border: 1px solid #f3caca; }
        .feedback-error span:first-child { background: var(--danger); }
        .feedback-success { color: #1d6a43; background: #edf9f1; border: 1px solid #c9ead5; }
        .feedback-success span:first-child { background: var(--success); }
        .login-hint { margin: -3px 0 0; color: var(--muted); font-size: 12px; line-height: 1.5; }
        .login-button { display: inline-flex; align-items: center; justify-content: center; gap: 10px; min-height: 52px; margin-top: 2px; color: #fff; background: linear-gradient(135deg, var(--primary), #f1903f); border: 0; border-radius: 13px; box-shadow: 0 12px 24px rgba(228,87,46,.20); cursor: pointer; font-weight: 800; transition: .2s ease; }
        .login-button:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 16px 28px rgba(228,87,46,.28); }
        .login-button:disabled { opacity: .65; }
        .btn-spinner { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,.4); border-top-color: #fff; border-radius: 50%; animation: spin .7s linear infinite; }
        .login-footer { display: flex; justify-content: center; gap: 8px; margin: 28px 0 0; padding-top: 20px; color: var(--soft-muted); border-top: 1px solid var(--line); font-size: 12px; }
        .login-footer span { color: var(--yellow); }
        @media (max-width: 900px) { .login-layout { grid-template-columns: 1fr; } .login-art-side { display: none; } .login-form-side { min-height: 100vh; padding: 24px; } }
        @media (max-width: 480px) { .login-form-side { padding: 14px; } .login-card { padding: 28px 20px; border-radius: 20px; } .login-title { font-size: 26px; } }
      `}</style>
    </main>
  );
}
