import { useEffect, useState } from 'react';
import { buscarPedidos } from './firebase';

function formatarData(data) {
  if (!data) return 'Data indisponível';
  const valor = typeof data?.toDate === 'function' ? data.toDate() : new Date(data);
  if (Number.isNaN(valor.getTime())) return 'Data indisponível';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(valor);
}

function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(valor) || 0);
}

export default function Historico({ estabelecimentoId }) {
  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      if (!estabelecimentoId) {
        setCarregando(false);
        return;
      }
      setCarregando(true);
      setErro('');
      try {
        const dados = await buscarPedidos(estabelecimentoId);
        if (ativo) setPedidos(dados);
      } catch (error) {
        console.error('Erro ao carregar histórico:', error);
        if (ativo) setErro('Não foi possível carregar o histórico agora.');
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    carregar();
    return () => { ativo = false; };
  }, [estabelecimentoId]);

  if (carregando) {
    return <div className="historico-state"><div className="spinner" aria-hidden="true" /><p>Carregando suas rotas...</p></div>;
  }

  if (erro) {
    return <div className="historico-state"><span className="historico-state-icon" aria-hidden="true">!</span><h3>Algo deu errado</h3><p>{erro}</p></div>;
  }

  return (
    <section className="historico-container" aria-labelledby="historico-title">
      <header className="historico-header">
        <div><p className="eyebrow">Visão geral</p><h2 id="historico-title">Histórico de rotas</h2><p>Acompanhe os pedidos já enviados para entrega.</p></div>
        <span className="historico-total">{pedidos.length} {pedidos.length === 1 ? 'rota' : 'rotas'}</span>
      </header>

      {pedidos.length === 0 ? (
        <div className="historico-empty"><span aria-hidden="true">📦</span><h3>Nenhuma rota por aqui ainda</h3><p>As rotas enviadas aparecerão neste espaço para você consultar quando quiser.</p></div>
      ) : (
        <div className="historico-list">
          {pedidos.map((pedido) => {
            const status = pedido.status || 'pendente';
            const statusClass = status.toLowerCase().replace(/\s+/g, '-');
            return (
            <article className="historico-card" key={pedido.id}>
              <div className="historico-card-top"><span className="historico-id">#{pedido.id.slice(0, 8)}</span><span className={`historico-status status-${statusClass}`}>{status}</span></div>
              <div className="historico-card-main"><div><strong>{pedido.quantidadeEntregas || pedido.entregas?.length || 0} entregas</strong><span>{formatarData(pedido.dataCriacao)}</span></div><div className="historico-value">{formatarMoeda(pedido.valorTotal)}</div></div>
              <div className="historico-card-detail"><span>📏 {Number(pedido.distanciaTotal || 0).toFixed(1)} km</span><span>📍 {pedido.coletaCidade || 'Origem cadastrada'}</span></div>
            </article>
            );
          })}
        </div>
      )}

      <style>{`
        .historico-container { padding: clamp(22px, 4vw, 38px); }
        .historico-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; margin-bottom: 26px; }
        .historico-header h2 { margin: 0 0 6px; font: 700 28px/1.1 'Space Grotesk', sans-serif; letter-spacing: -.04em; color: var(--ink); }
        .historico-header p:not(.eyebrow) { margin: 0; color: var(--muted); font-size: 14px; }
        .eyebrow { margin: 0 0 8px; color: var(--primary); font-size: 11px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
        .historico-total { padding: 8px 12px; color: var(--primary-dark); background: var(--primary-soft); border-radius: 999px; font-size: 13px; font-weight: 800; white-space: nowrap; }
        .historico-list { display: grid; gap: 12px; }
        .historico-card { padding: 18px; background: rgba(255,255,255,.8); border: 1px solid var(--line); border-radius: 16px; box-shadow: var(--shadow-sm); }
        .historico-card-top, .historico-card-main, .historico-card-detail { display: flex; align-items: center; justify-content: space-between; gap: 14px; }
        .historico-card-top { margin-bottom: 14px; }
        .historico-id { color: var(--muted); font: 700 12px/1 'Space Grotesk', sans-serif; letter-spacing: .08em; text-transform: uppercase; }
        .historico-status { padding: 5px 9px; border-radius: 999px; font-size: 11px; font-weight: 800; text-transform: capitalize; }
        .status-pendente { color: #855f11; background: #fff7df; }
        .status-em-andamento { color: #1f5d9d; background: #eaf4ff; }
        .status-concluido, .status-finalizado { color: #1e7145; background: #eaf8ef; }
        .historico-card-main strong, .historico-value { color: var(--ink); font: 700 17px/1.2 'Space Grotesk', sans-serif; }
        .historico-card-main span { display: block; margin-top: 5px; color: var(--muted); font-size: 12px; }
        .historico-value { color: var(--primary-dark); }
        .historico-card-detail { justify-content: flex-start; margin-top: 16px; padding-top: 12px; color: var(--muted); border-top: 1px solid var(--line); font-size: 12px; }
        .historico-empty, .historico-state { display: grid; justify-items: center; padding: 70px 24px; text-align: center; color: var(--muted); }
        .historico-empty > span, .historico-state-icon { display: grid; place-items: center; width: 64px; height: 64px; margin-bottom: 16px; color: var(--primary); background: var(--primary-soft); border-radius: 20px; font-size: 30px; }
        .historico-state-icon { color: #fff; background: var(--danger); font-weight: 800; }
        .historico-empty h3, .historico-state h3 { margin: 0 0 8px; color: var(--ink); font: 700 19px/1.2 'Space Grotesk', sans-serif; }
        .historico-empty p, .historico-state p { max-width: 420px; margin: 0; line-height: 1.6; font-size: 14px; }
        .historico-state .spinner { width: 34px; height: 34px; margin-bottom: 16px; }
        @media (max-width: 560px) { .historico-header { flex-direction: column; } .historico-card-detail { flex-wrap: wrap; } }
      `}</style>
    </section>
  );
}
