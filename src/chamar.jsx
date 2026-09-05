// ============================================
// CHAMAR.JSX - VERSÃO MELHORADA
// ============================================
import React, { useState, useEffect } from 'react';
import MapaRota from './MapaRota';
import { criarPedido, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

// ============================================
// COMPONENTE: EntregaItem
// ============================================
const EntregaItem = ({ 
  index, 
  entrega, 
  onUpdate, 
  onRemove, 
  totalEntregas,
  disabled,
  isFirst
}) => {
  const [expandido, setExpandido] = useState(isFirst || false);
  const [erros, setErros] = useState({});

  const handleChange = (campo, valor) => {
    // Limpa erro do campo
    if (erros[campo]) {
      setErros(prev => ({ ...prev, [campo]: false }));
    }
    onUpdate(index, { ...entrega, [campo]: valor });
  };

  const toggleExpand = () => {
    if (!disabled) setExpandido(!expandido);
  };

  // Validação para exibir erros
  const validarCampo = (campo) => {
    if (!entrega[campo]?.trim()) {
      setErros(prev => ({ ...prev, [campo]: true }));
      return false;
    }
    return true;
  };

  const temErros = () => {
    const campos = ['cliente', 'enderecoEntrega'];
    let hasError = false;
    campos.forEach(campo => {
      if (!validarCampo(campo)) hasError = true;
    });
    return hasError;
  };

  return (
    <div className={`entrega-item ${expandido ? 'expanded' : ''} ${temErros() ? 'has-error' : ''}`}>
      <div className="entrega-header" onClick={toggleExpand}>
        <div className="entrega-header-left">
          <span className="entrega-numero">#{index + 1}</span>
          <span className="entrega-titulo">
            {entrega.cliente || 'Cliente não definido'}
          </span>
          {entrega.distanciaKm > 0 && (
            <span className="entrega-distancia-badge">
              📏 {entrega.distanciaKm.toFixed(1)} km
            </span>
          )}
          {temErros() && (
            <span className="entrega-error-badge">⚠️</span>
          )}
        </div>
        <div className="entrega-header-right">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(index);
            }}
            className="entrega-remover"
            disabled={disabled || totalEntregas <= 1}
            title={totalEntregas <= 1 ? 'Mínimo 1 entrega' : 'Remover entrega'}
          >
            ✕
          </button>
          <span className="entrega-expandir">
            {expandido ? '▲' : '▼'}
          </span>
        </div>
      </div>

      {expandido && !disabled && (
        <div className="entrega-body">
          <div className="entrega-grid">
            <div className="entrega-campo">
              <label className="field-label">
                Nome do Cliente <span className="field-required">*</span>
              </label>
              <input
                type="text"
                value={entrega.cliente || ''}
                onChange={(e) => handleChange('cliente', e.target.value)}
                placeholder="Nome do destinatário"
                className={`field-input ${erros.cliente ? 'error' : ''}`}
              />
              {erros.cliente && (
                <span className="field-error">Nome do cliente é obrigatório</span>
              )}
            </div>

            <div className="entrega-campo">
              <label className="field-label">Telefone / WhatsApp</label>
              <input
                type="tel"
                value={entrega.telefone || ''}
                onChange={(e) => handleChange('telefone', e.target.value)}
                placeholder="(16) 99999-9999"
                className="field-input"
              />
            </div>

            <div className="entrega-campo entrega-campo-full">
              <label className="field-label">
                Endereço de Entrega <span className="field-required">*</span>
              </label>
              <input
                type="text"
                value={entrega.enderecoEntrega || ''}
                onChange={(e) => handleChange('enderecoEntrega', e.target.value)}
                placeholder="Rua, número, bairro, cidade - UF"
                className={`field-input ${erros.enderecoEntrega ? 'error' : ''}`}
              />
              {erros.enderecoEntrega && (
                <span className="field-error">Endereço é obrigatório</span>
              )}
            </div>

            <div className="entrega-campo entrega-campo-full">
              <label className="field-label">Descrição do Pedido</label>
              <textarea
                value={entrega.descricao || ''}
                onChange={(e) => handleChange('descricao', e.target.value)}
                placeholder="Ex: 1 Pizza Marguerita, 1 Coca 2L, NF 123456..."
                rows={2}
                className="field-textarea"
              />
            </div>

            <div className="entrega-campo">
              <label className="field-label">Nº do Pedido</label>
              <input
                type="text"
                value={entrega.numeroPedido || ''}
                onChange={(e) => handleChange('numeroPedido', e.target.value)}
                placeholder="Ex: #1234"
                className="field-input"
              />
            </div>

            <div className="entrega-campo">
              <label className="field-label">Valor do Pedido (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={entrega.valorPedido || ''}
                onChange={(e) => handleChange('valorPedido', parseFloat(e.target.value) || 0)}
                placeholder="0,00"
                className="field-input"
              />
            </div>

            <div className="entrega-campo entrega-campo-full">
              <label className="field-label">Observações</label>
              <textarea
                value={entrega.observacao || ''}
                onChange={(e) => handleChange('observacao', e.target.value)}
                placeholder="Interfone, portaria, ponto de referência..."
                rows={2}
                className="field-textarea"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// COMPONENTE PRINCIPAL: Chamar
// ============================================
export default function Chamar({ estabelecimentoId, estabelecimentoNome, restauranteSlug }) {
  const [dadosColeta, setDadosColeta] = useState(null);
  const [carregandoColeta, setCarregandoColeta] = useState(true);
  const [entregas, setEntregas] = useState(() => [
    {
      id: Date.now(),
      cliente: '',
      telefone: '',
      enderecoEntrega: '',
      descricao: '',
      numeroPedido: '',
      valorPedido: 0,
      observacao: '',
      distanciaKm: 0
    }
  ]);
  const [observacaoGeral, setObservacaoGeral] = useState('');
  const [distanciaTotal, setDistanciaTotal] = useState(0);
  const [valorTotal, setValorTotal] = useState(10);
  const [carregando, setCarregando] = useState(false);
  const [pedidoEnviado, setPedidoEnviado] = useState(false);
  const [erroEnvio, setErroEnvio] = useState('');
  const [pedidoId, setPedidoId] = useState(null);

  // ============================================
  // CARREGAR DADOS DO ESTABELECIMENTO
  // ============================================
  useEffect(() => {
    if (estabelecimentoId) {
      carregarDadosEstabelecimento();
    }
  }, [estabelecimentoId]);

  const carregarDadosEstabelecimento = async () => {
    setCarregandoColeta(true);
    try {
      const docRef = doc(db, "estabelecimentos", estabelecimentoId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setDadosColeta({
          nome: data.nome || estabelecimentoNome || 'Restaurante',
          uf: data.uf || '',
          cidade: data.cidade || '',
          bairro: data.bairro || '',
          logradouro: data.logradouro || '',
          numero: data.numero || '',
          complemento: data.complemento || '',
          enderecoCompleto: data.enderecoCompleto || ''
        });
      } else {
        setDadosColeta(null);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do estabelecimento:', error);
      setDadosColeta(null);
    } finally {
      setCarregandoColeta(false);
    }
  };

  // ============================================
  // HANDLERS DE ENTREGAS
  // ============================================
  const handleUpdateEntrega = (index, novosDados) => {
    setEntregas(prev => {
      const novas = [...prev];
      novas[index] = { ...novas[index], ...novosDados };
      return novas;
    });
  };

  const handleAddEntrega = () => {
    if (entregas.length >= 10) {
      alert('⚠️ Máximo de 10 entregas por rota');
      return;
    }
    setEntregas(prev => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        cliente: '',
        telefone: '',
        enderecoEntrega: '',
        descricao: '',
        numeroPedido: '',
        valorPedido: 0,
        observacao: '',
        distanciaKm: 0
      }
    ]);
  };

  const handleRemoveEntrega = (index) => {
    if (entregas.length <= 1) {
      alert('⚠️ É necessário ter pelo menos uma entrega');
      return;
    }
    if (window.confirm(`Remover entrega #${index + 1}?`)) {
      setEntregas(prev => prev.filter((_, i) => i !== index));
    }
  };

  // ============================================
  // VALOR CALCULADO
  // ============================================
  const handleValorCalculado = (valorCalculado, dist) => {
    setValorTotal(valorCalculado);
    setDistanciaTotal(dist || 0);
    
    if (dist > 0 && entregas.length > 0) {
      const distPorEntrega = dist / entregas.length;
      setEntregas(prev => 
        prev.map(entrega => ({
          ...entrega,
          distanciaKm: distPorEntrega
        }))
      );
    }
  };

  // ============================================
  // VALIDAR ENTREGAS
  // ============================================
  const validarEntregas = () => {
    for (let i = 0; i < entregas.length; i++) {
      const e = entregas[i];
      if (!e.cliente?.trim()) {
        alert(`⚠️ Informe o nome do cliente para entrega #${i + 1}`);
        return false;
      }
      if (!e.enderecoEntrega?.trim()) {
        alert(`⚠️ Informe o endereço de entrega #${i + 1}`);
        return false;
      }
    }
    return true;
  };

  // ============================================
  // ENVIAR PEDIDO
  // ============================================
  const enviarPedido = async () => {
    if (!dadosColeta || !dadosColeta.enderecoCompleto) {
      alert('⚠️ Configure os dados do estabelecimento em "Meus Dados" primeiro');
      return;
    }

    if (!validarEntregas()) return;

    if (distanciaTotal === 0) {
      alert('⚠️ Aguarde o cálculo da rota antes de enviar');
      return;
    }

    setCarregando(true);
    setErroEnvio('');
    setPedidoId(null);

    try {
      const pedido = {
        estabelecimentoId,
        estabelecimentoNome: dadosColeta.nome || estabelecimentoNome,
        restauranteSlug,
        coletaEndereco: dadosColeta.enderecoCompleto,
        coletaUF: dadosColeta.uf,
        coletaCidade: dadosColeta.cidade,
        entregas: entregas.map(e => ({
          cliente: e.cliente.trim(),
          telefone: e.telefone?.trim() || '',
          endereco: e.enderecoEntrega.trim(),
          descricao: e.descricao?.trim() || '',
          numeroPedido: e.numeroPedido?.trim() || '',
          valorPedido: e.valorPedido || 0,
          observacao: e.observacao?.trim() || '',
          distanciaKm: e.distanciaKm || 0
        })),
        observacaoGeral: observacaoGeral?.trim() || '',
        distanciaTotal,
        valorTotal,
        quantidadeEntregas: entregas.length,
        status: 'pendente',
        dataCriacao: new Date().toISOString(),
        urlAcesso: restauranteSlug ? `https://javaiportal.web.app/${restauranteSlug}` : null
      };

      const id = await criarPedido(pedido);
      setPedidoId(id);
      setPedidoEnviado(true);
      setErroEnvio('');
      
      // Limpa o formulário
      setEntregas([
        {
          id: Date.now(),
          cliente: '',
          telefone: '',
          enderecoEntrega: '',
          descricao: '',
          numeroPedido: '',
          valorPedido: 0,
          observacao: '',
          distanciaKm: 0
        }
      ]);
      setObservacaoGeral('');
      setDistanciaTotal(0);
      setValorTotal(10);
      
      setTimeout(() => setPedidoEnviado(false), 6000);
    } catch (error) {
      console.error("Erro ao criar pedido:", error);
      setErroEnvio('❌ Erro ao enviar pedido. Verifique sua conexão e tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  // ============================================
  // VERIFICAR SE PODE ENVIAR
  // ============================================
  const podeEnviar = () => {
    if (carregando) return false;
    if (distanciaTotal === 0) return false;
    if (!dadosColeta?.enderecoCompleto) return false;
    
    for (const e of entregas) {
      if (!e.cliente?.trim()) return false;
      if (!e.enderecoEntrega?.trim()) return false;
    }
    return true;
  };

  // ============================================
  // RENDER
  // ============================================
  if (carregandoColeta) {
    return (
      <div className="chamar-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Carregando dados do estabelecimento...</p>
        </div>
      </div>
    );
  }

  if (!dadosColeta || !dadosColeta.enderecoCompleto) {
    return (
      <div className="chamar-container">
        <div className="config-aviso">
          <span className="config-aviso-icon">⚠️</span>
          <h3>Configure seu endereço de coleta</h3>
          <p>
            Para começar a roteirizar entregas, você precisa configurar 
            o endereço do seu estabelecimento em <strong>"Meus Dados"</strong>.
          </p>
          <p className="config-aviso-hint">
            Clique em <strong>"⚙️ Meus Dados"</strong> no menu lateral para configurar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="chamar-container">
      {/* Header */}
      <div className="chamar-header">
        <div className="chamar-header-left">
          <span className="header-icon">🚀</span>
          <h2>Roteirizar Entregas</h2>
        </div>
        <div className="chamar-header-right">
          <span className="chamar-badge">
            {dadosColeta.nome || estabelecimentoNome}
          </span>
          <span className="entrega-count">
            📦 {entregas.length} entrega{entregas.length > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Info da Coleta */}
      <div className="coleta-info">
        <div className="coleta-info-header">
          <span>📍 Endereço de Coleta (Origem)</span>
          <span className="coleta-info-fonte">✓ Carregado automaticamente</span>
        </div>
        <div className="coleta-info-endereco">
          <strong>{dadosColeta.nome}</strong>
          <span>{dadosColeta.enderecoCompleto}</span>
        </div>
      </div>

      {/* Entregas */}
      <div className="entregas-section">
        <div className="entregas-header">
          <span className="section-titulo">🏠 Entregas</span>
          <button
            onClick={handleAddEntrega}
            className="btn-add-entrega"
            disabled={entregas.length >= 10 || carregando}
          >
            + Adicionar Entrega
          </button>
        </div>

        <div className="entregas-list">
          {entregas.map((entrega, index) => (
            <EntregaItem
              key={entrega.id}
              index={index}
              entrega={entrega}
              onUpdate={handleUpdateEntrega}
              onRemove={handleRemoveEntrega}
              totalEntregas={entregas.length}
              disabled={carregando}
              isFirst={index === 0}
            />
          ))}
        </div>

        {/* Observação Geral */}
        <div className="form-section">
          <label className="field-label">Observações Gerais da Rota</label>
          <textarea
            value={observacaoGeral}
            onChange={(e) => setObservacaoGeral(e.target.value)}
            placeholder="Instruções gerais para o entregador..."
            rows={2}
            className="field-textarea"
          />
        </div>
      </div>

      {/* Mapa */}
      <div className="map-section">
        <MapaRota
          enderecoColeta={dadosColeta.enderecoCompleto}
          enderecoEntrega={entregas[0]?.enderecoEntrega || ''}
          entregas={entregas}
          onValorCalculado={handleValorCalculado}
        />
        {entregas.length > 1 && (
          <div className="mapa-aviso-multiplas">
            📍 Rota otimizada com {entregas.length} entregas
          </div>
        )}
      </div>

      {/* Barra de Ação Fixa */}
      <div className="resumo-bar-fixed">
        <div className="resumo-info">
          <div className="resumo-primeira-linha">
            <span className="resumo-label">Total da Rota:</span>
            <span className="resumo-valor">R$ {valorTotal.toFixed(2)}</span>
          </div>
          <div className="resumo-detalhe">
            📏 {distanciaTotal.toFixed(1)} km • 📦 {entregas.length} entrega{entregas.length > 1 ? 's' : ''}
          </div>
          <div className="resumo-detalhe">
            Taxa base R$ 10,00 + {distanciaTotal.toFixed(1)} km × R$ 2,50
          </div>
        </div>

        <button
          onClick={enviarPedido}
          disabled={!podeEnviar()}
          className="btn-enviar"
        >
          {carregando ? (
            <>
              <span className="btn-spinner"></span>
              Enviando...
            </>
          ) : (
            <>
              <span className="btn-icon">📦</span>
              Enviar {entregas.length} Entrega{entregas.length > 1 ? 's' : ''}
            </>
          )}
        </button>
      </div>

      {/* Toast de Sucesso */}
      {pedidoEnviado && (
        <div className="toast-success">
          <span className="toast-icon">✅</span>
          <div>
            <span className="toast-title">Rota enviada com sucesso!</span>
            <span className="toast-detail">
              {entregas.length} entrega{entregas.length > 1 ? 's' : ''} cadastrada{entregas.length > 1 ? 's' : ''}
              {pedidoId && ` • ID: ${pedidoId.slice(0, 8)}`}
            </span>
          </div>
        </div>
      )}

      {/* Toast de Erro */}
      {erroEnvio && (
        <div className="toast-error">
          <span className="toast-icon">❌</span>
          <span>{erroEnvio}</span>
        </div>
      )}

      <style>{`
        /* ============================================ */
        /* CHAMAR - ESTILOS MELHORADOS                 */
        /* ============================================ */
        
        .chamar-container {
          padding: 24px;
          max-width: 1100px;
          margin: 0 auto;
          width: 100%;
          box-sizing: border-box;
          padding-bottom: 120px;
        }

        /* Loading */
        .loading-spinner {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          gap: 16px;
        }

        .spinner {
          width: 48px;
          height: 48px;
          border: 4px solid rgba(229, 57, 53, 0.1);
          border-top-color: #E53935;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .loading-spinner p {
          color: #757575;
          font-size: 15px;
          margin: 0;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Config Aviso */
        .config-aviso {
          padding: 40px 30px;
          text-align: center;
          max-width: 500px;
          margin: 60px auto;
          background: rgba(255, 255, 255, 0.85);
          border-radius: 16px;
          border: 2px dashed rgba(229, 57, 53, 0.2);
        }

        .config-aviso-icon {
          font-size: 48px;
          display: block;
          margin-bottom: 16px;
        }

        .config-aviso h3 {
          font-size: 20px;
          color: #212121;
          margin: 0 0 8px 0;
        }

        .config-aviso p {
          color: #757575;
          font-size: 15px;
          margin: 0 0 20px 0;
          line-height: 1.6;
        }

        .config-aviso-hint {
          font-size: 13px !important;
          color: #9E9E9E !important;
          margin-top: 12px !important;
        }

        /* Header */
        .chamar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          margin-bottom: 20px;
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          flex-wrap: wrap;
          gap: 10px;
        }

        .chamar-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .header-icon {
          font-size: 28px;
        }

        .chamar-header h2 {
          margin: 0;
          font-size: 22px;
          font-weight: 700;
          background: linear-gradient(135deg, #E53935, #C62828);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .chamar-header-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .chamar-badge {
          font-size: 13px;
          color: #757575;
          background: rgba(229, 57, 53, 0.08);
          padding: 6px 16px;
          border-radius: 20px;
          font-weight: 500;
          border: 1px solid rgba(229, 57, 53, 0.1);
        }

        .entrega-count {
          font-size: 14px;
          font-weight: 600;
          color: #E53935;
          background: rgba(229, 57, 53, 0.1);
          padding: 6px 16px;
          border-radius: 20px;
        }

        /* Coleta Info */
        .coleta-info {
          padding: 16px 20px;
          margin-bottom: 20px;
          background: rgba(255, 255, 255, 0.7);
          border-radius: 12px;
          border: 1px solid rgba(229, 57, 53, 0.1);
        }

        .coleta-info-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .coleta-info-header span {
          font-weight: 600;
          font-size: 14px;
          color: #757575;
        }

        .coleta-info-fonte {
          font-size: 12px;
          color: #43A047;
          font-weight: 500;
        }

        .coleta-info-endereco {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .coleta-info-endereco strong {
          font-size: 16px;
          color: #212121;
        }

        .coleta-info-endereco span {
          font-size: 14px;
          color: #424242;
        }

        /* Entregas */
        .entregas-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 20px;
        }

        .entregas-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 4px;
        }

        .section-titulo {
          font-weight: 600;
          font-size: 16px;
          color: #757575;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .btn-add-entrega {
          background: rgba(229, 57, 53, 0.08);
          border: 2px dashed rgba(229, 57, 53, 0.3);
          color: #E53935;
          padding: 8px 20px;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.3s ease;
        }

        .btn-add-entrega:hover:not(:disabled) {
          background: #E53935;
          color: #fff;
          border-color: #E53935;
        }

        .btn-add-entrega:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .entregas-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        /* Entrega Item */
        .entrega-item {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .entrega-item.has-error {
          border-color: rgba(229, 57, 53, 0.3);
        }

        .entrega-item.expanded {
          border-color: rgba(229, 57, 53, 0.2);
        }

        .entrega-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .entrega-header:hover {
          background: rgba(229, 57, 53, 0.03);
        }

        .entrega-header-left {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .entrega-numero {
          font-weight: 700;
          color: #E53935;
          font-size: 13px;
          background: rgba(229, 57, 53, 0.1);
          padding: 2px 10px;
          border-radius: 6px;
        }

        .entrega-titulo {
          font-weight: 500;
          color: #212121;
          font-size: 14px;
        }

        .entrega-distancia-badge {
          font-size: 11px;
          color: #757575;
          background: rgba(0, 0, 0, 0.05);
          padding: 2px 10px;
          border-radius: 12px;
        }

        .entrega-error-badge {
          font-size: 14px;
        }

        .entrega-header-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .entrega-remover {
          background: none;
          border: none;
          color: #BDBDBD;
          cursor: pointer;
          font-size: 16px;
          padding: 4px 8px;
          border-radius: 6px;
          transition: all 0.3s ease;
        }

        .entrega-remover:hover:not(:disabled) {
          color: #E53935;
          background: rgba(229, 57, 53, 0.1);
        }

        .entrega-remover:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .entrega-expandir {
          font-size: 11px;
          color: #757575;
        }

        .entrega-body {
          padding: 16px 18px 20px;
          border-top: 1px solid rgba(0, 0, 0, 0.05);
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .entrega-grid {
          display: grid;
          gap: 12px 16px;
          grid-template-columns: 1fr 1fr;
        }

        .entrega-campo {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .entrega-campo-full {
          grid-column: span 2;
        }

        .field-label {
          display: block;
          font-weight: 600;
          margin-bottom: 4px;
          font-size: 13px;
          color: #424242;
        }

        .field-required {
          color: #E53935;
          font-weight: 700;
        }

        .field-input, .field-textarea {
          width: 100%;
          padding: 10px 14px;
          border-radius: 10px;
          border: 2px solid rgba(229, 57, 53, 0.15);
          font-size: 14px;
          transition: all 0.3s ease;
          background: rgba(255, 255, 255, 0.7);
          color: #212121;
          outline: none;
          box-sizing: border-box;
          font-family: inherit;
        }

        .field-input:focus, .field-textarea:focus {
          border-color: #E53935;
          background: #FFFFFF;
          box-shadow: 0 0 0 4px rgba(229, 57, 53, 0.08);
        }

        .field-input.error {
          border-color: #E53935;
          background: rgba(229, 57, 53, 0.04);
        }

        .field-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background: rgba(200, 200, 200, 0.2);
        }

        .field-textarea {
          resize: vertical;
          line-height: 1.4;
        }

        .field-error {
          font-size: 12px;
          color: #E53935;
          margin-top: 2px;
        }

        /* Form Section */
        .form-section {
          padding: 20px;
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        /* Mapa */
        .map-section {
          padding: 10px;
          margin-bottom: 20px;
          height: 400px;
          min-height: 300px;
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          overflow: hidden;
          position: relative;
        }

        .mapa-aviso-multiplas {
          position: absolute;
          bottom: 16px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.7);
          color: #fff;
          padding: 6px 18px;
          border-radius: 20px;
          font-size: 13px;
          z-index: 10;
          white-space: nowrap;
        }

        /* Barra de Ação Fixa */
        .resumo-bar-fixed {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          max-width: 1040px;
          width: calc(100% - 60px);
          padding: 16px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          z-index: 90;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          box-shadow: 0 8px 40px rgba(0, 0, 0, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .resumo-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .resumo-primeira-linha {
          display: flex;
          align-items: baseline;
          gap: 10px;
        }

        .resumo-label {
          font-size: 14px;
          color: #757575;
          font-weight: 500;
        }

        .resumo-valor {
          font-size: 28px;
          font-weight: 800;
          color: #E53935;
          letter-spacing: -1px;
        }

        .resumo-detalhe {
          font-size: 12px;
          color: #9E9E9E;
        }

        .btn-enviar {
          padding: 14px 32px;
          background: linear-gradient(135deg, #E53935, #C62828);
          color: #fff;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 16px rgba(229, 57, 53, 0.25);
          display: flex;
          align-items: center;
          gap: 10px;
          white-space: nowrap;
        }

        .btn-enviar:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(229, 57, 53, 0.4);
        }

        .btn-enviar:disabled {
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

        .btn-icon {
          font-size: 18px;
        }

        /* Toasts */
        .toast-success, .toast-error {
          position: fixed;
          top: 24px;
          right: 24px;
          padding: 16px 24px;
          border-radius: 12px;
          z-index: 1000;
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 500;
          font-size: 14px;
          max-width: 420px;
          animation: slideIn 0.4s ease-out;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .toast-success {
          background: rgba(232, 245, 233, 0.95);
          border-left: 5px solid #2E7D32;
          color: #1B5E20;
        }

        .toast-error {
          background: rgba(255, 235, 238, 0.95);
          border-left: 5px solid #E53935;
          color: #C62828;
        }

        .toast-icon {
          font-size: 24px;
        }

        .toast-title {
          font-weight: 600;
          display: block;
        }

        .toast-detail {
          font-size: 13px;
          font-weight: 400;
          opacity: 0.8;
        }

        /* Responsivo */
        @media (max-width: 1024px) {
          .resumo-bar-fixed {
            width: calc(100% - 40px);
          }
        }

        @media (max-width: 768px) {
          .chamar-container {
            padding: 16px;
            padding-bottom: 140px;
          }

          .chamar-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .chamar-header-right {
            width: 100%;
            justify-content: flex-start;
          }

          .resumo-bar-fixed {
            flex-direction: column;
            align-items: stretch;
            text-align: center;
            width: calc(100% - 24px);
            bottom: 12px;
            padding: 16px 20px;
            border-radius: 12px;
          }

          .resumo-primeira-linha {
            justify-content: center;
          }

          .btn-enviar {
            justify-content: center;
            width: 100%;
          }

          .entrega-grid {
            grid-template-columns: 1fr;
          }

          .entrega-campo-full {
            grid-column: span 1;
          }

          .map-section {
            height: 320px;
            min-height: 220px;
          }

          .mapa-aviso-multiplas {
            font-size: 11px;
            padding: 4px 14px;
            white-space: normal;
            max-width: 90%;
            bottom: 12px;
          }

          .toast-success, .toast-error {
            top: 12px;
            right: 12px;
            left: 12px;
            max-width: none;
          }
        }

        @media (max-width: 480px) {
          .chamar-container {
            padding: 12px;
            padding-bottom: 160px;
          }

          .chamar-header h2 {
            font-size: 18px;
          }

          .resumo-valor {
            font-size: 24px;
          }

          .resumo-bar-fixed {
            padding: 14px 16px;
            width: calc(100% - 16px);
          }

          .btn-enviar {
            font-size: 14px;
            padding: 12px 20px;
          }

          .entrega-header {
            flex-wrap: wrap;
            gap: 6px;
          }

          .entrega-header-right {
            width: 100%;
            justify-content: flex-end;
          }

          .map-section {
            height: 260px;
            min-height: 180px;
          }

          .coleta-info-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }

          .config-aviso {
            padding: 30px 20px;
            margin: 30px 10px;
          }
        }
      `}</style>
    </div>
  );
}