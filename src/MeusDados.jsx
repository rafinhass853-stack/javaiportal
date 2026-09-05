// ============================================
// MEUSDADOS.JSX - VERSÃO MELHORADA
// ============================================
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Correção dos ícones padrão do Leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const { BaseLayer } = LayersControl;

// ============================================
// COMPONENTE: MapaHibrido
// ============================================
function MapaHibrido() {
  return (
    <>
      <TileLayer
        attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        opacity={0.5}
        zIndex={1000}
      />
    </>
  );
}

// ============================================
// COMPONENTE: SearchControl
// ============================================
function SearchControl({ onEnderecoEncontrado, onCarregando, onErro }) {
  const map = useMap();
  const [termo, setTermo] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [resultados, setResultados] = useState([]);
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);
  const timeoutRef = useRef(null);

  const buscarEnderecos = async (query) => {
    if (!query || query.trim().length < 3) {
      setResultados([]);
      setMostrarResultados(false);
      return;
    }

    setBuscando(true);
    if (onCarregando) onCarregando(true);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=BR&addressdetails=1&accept-language=pt-BR`,
        { headers: { 'User-Agent': 'JaVaiApp/1.0' } }
      );

      if (!response.ok) throw new Error('Erro na API');

      const data = await response.json();
      
      if (data && data.length > 0) {
        const resultadosFormatados = data.map(item => ({
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          displayName: item.display_name,
          endereco: item.display_name.split(',')[0].trim(),
          cidade: item.address?.city || item.address?.town || item.address?.village || '',
          uf: item.address?.state || '',
          bairro: item.address?.suburb || item.address?.neighbourhood || '',
          logradouro: item.address?.road || item.address?.street || '',
          numero: item.address?.house_number || '',
          cep: item.address?.postcode || ''
        }));
        setResultados(resultadosFormatados);
        setMostrarResultados(true);
        if (onErro) onErro(false);
      } else {
        setResultados([]);
        setMostrarResultados(false);
        if (onErro) onErro(true);
      }
    } catch (error) {
      console.error('Erro ao buscar endereço:', error);
      setResultados([]);
      setMostrarResultados(false);
      if (onErro) onErro(true);
    } finally {
      setBuscando(false);
      if (onCarregando) onCarregando(false);
    }
  };

  // Debounce da busca
  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(() => {
      if (termo.trim().length >= 3) {
        buscarEnderecos(termo);
      } else {
        setResultados([]);
        setMostrarResultados(false);
      }
    }, 500);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [termo]);

  // Fechar resultados ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (resultsRef.current && !resultsRef.current.contains(event.target) &&
          inputRef.current && !inputRef.current.contains(event.target)) {
        setMostrarResultados(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Selecionar um resultado
  const selecionarResultado = (resultado) => {
    const coords = [resultado.lat, resultado.lon];
    map.setView(coords, 17);
    
    if (onEnderecoEncontrado) {
      onEnderecoEncontrado({
        enderecoCompleto: resultado.displayName,
        cidade: resultado.cidade || '',
        uf: resultado.uf || '',
        bairro: resultado.bairro || '',
        logradouro: resultado.logradouro || resultado.endereco || '',
        numero: resultado.numero || '',
        cep: resultado.cep || '',
        lat: resultado.lat,
        lon: resultado.lon,
        coords
      });
    }

    setTermo('');
    setResultados([]);
    setMostrarResultados(false);
  };

  return (
    <div className="search-control-container">
      <div className="search-input-wrapper">
        <span className="search-icon">🔍</span>
        <input
          ref={inputRef}
          type="text"
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          placeholder="Digite o endereço do seu estabelecimento..."
          className="search-input"
          onFocus={() => {
            if (resultados.length > 0) setMostrarResultados(true);
          }}
        />
        {buscando && <span className="search-loading">⏳</span>}
      </div>

      {mostrarResultados && resultados.length > 0 && (
        <div ref={resultsRef} className="search-results">
          {resultados.map((item, index) => (
            <div
              key={index}
              className="search-result-item"
              onClick={() => selecionarResultado(item)}
            >
              <div className="search-result-main">
                <span className="search-result-icon">📍</span>
                <span className="search-result-nome">{item.endereco}</span>
              </div>
              <div className="search-result-detalhe">
                {item.cidade}{item.uf ? ` - ${item.uf}` : ''}
                {item.bairro ? `, ${item.bairro}` : ''}
              </div>
            </div>
          ))}
        </div>
      )}

      {mostrarResultados && resultados.length === 0 && termo.trim().length >= 3 && !buscando && (
        <div className="search-results">
          <div className="search-result-empty">
            <span>🔍</span>
            <p>Nenhum endereço encontrado</p>
            <p className="search-result-hint">Tente buscar por cidade, rua ou CEP</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// COMPONENTE: CenterMap
// ============================================
function CenterMap({ coordenadas }) {
  const map = useMap();

  useEffect(() => {
    if (coordenadas) {
      map.setView(coordenadas, 17);
    }
  }, [coordenadas, map]);

  return null;
}

// ============================================
// COMPONENTE PRINCIPAL: MeusDados
// ============================================
export default function MeusDados({ estabelecimentoId, onDadosSalvos }) {
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [mensagemErro, setMensagemErro] = useState('');
  const [mensagemTipo, setMensagemTipo] = useState('');

  // Estados do Formulário
  const [nomeEstabelecimento, setNomeEstabelecimento] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [uf, setUf] = useState('');
  const [cidade, setCidade] = useState('');
  const [bairro, setBairro] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [cep, setCep] = useState('');
  const [enderecoCompleto, setEnderecoCompleto] = useState('');
  const [coordenadasMapa, setCoordenadasMapa] = useState(null);
  const [carregandoMapa, setCarregandoMapa] = useState(false);
  const [erroMapa, setErroMapa] = useState(false);
  const [dadosIniciais, setDadosIniciais] = useState(null);

  // ============================================
  // CARREGAR DADOS
  // ============================================
  useEffect(() => {
    if (estabelecimentoId) {
      carregarDados();
    }
  }, [estabelecimentoId]);

  const carregarDados = async () => {
    setCarregando(true);
    try {
      const docRef = doc(db, "estabelecimentos", estabelecimentoId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setNomeEstabelecimento(data.nome || '');
        setTelefone(data.telefone || '');
        setEmail(data.email || '');
        setUf(data.uf || '');
        setCidade(data.cidade || '');
        setBairro(data.bairro || '');
        setLogradouro(data.logradouro || '');
        setNumero(data.numero || '');
        setComplemento(data.complemento || '');
        setCep(data.cep || '');
        setEnderecoCompleto(data.enderecoCompleto || '');
        setDadosIniciais(data);
        
        if (data.enderecoCompleto) {
          buscarCoordenadasPorEndereco(data.enderecoCompleto);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setMensagemErro('❌ Erro ao carregar dados do estabelecimento');
      setMensagemTipo('erro');
    } finally {
      setCarregando(false);
    }
  };

  // ============================================
  // BUSCAR COORDENADAS
  // ============================================
  const buscarCoordenadasPorEndereco = async (endereco) => {
    if (!endereco || endereco.trim().length < 5) {
      setCoordenadasMapa(null);
      return;
    }

    setCarregandoMapa(true);
    setErroMapa(false);
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(endereco)}&limit=1&countrycodes=BR`,
        { headers: { 'User-Agent': 'JaVaiApp/1.0' } }
      );

      if (!response.ok) throw new Error('Erro na API');

      const data = await response.json();
      
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        setCoordenadasMapa([lat, lon]);
        setErroMapa(false);
      } else {
        setCoordenadasMapa(null);
        setErroMapa(true);
      }
    } catch (error) {
      console.error('Erro ao buscar coordenadas:', error);
      setCoordenadasMapa(null);
      setErroMapa(true);
    } finally {
      setCarregandoMapa(false);
    }
  };

  // ============================================
  // HANDLER: Endereço encontrado
  // ============================================
  const handleEnderecoEncontrado = (dados) => {
    setEnderecoCompleto(dados.enderecoCompleto);
    setCidade(dados.cidade || '');
    setUf(dados.uf || '');
    setBairro(dados.bairro || '');
    setLogradouro(dados.logradouro || '');
    setNumero(dados.numero || '');
    setCep(dados.cep || '');
    setCoordenadasMapa(dados.coords);
    setErroMapa(false);
    setMensagem('✅ Endereço localizado! Verifique os dados e clique em Salvar.');
    setMensagemTipo('sucesso');
    setTimeout(() => setMensagem(''), 5000);
  };

  // ============================================
  // SALVAR DADOS
  // ============================================
  const salvarDados = async () => {
    // Validações
    if (!nomeEstabelecimento.trim()) {
      setMensagemErro('⚠️ Nome do estabelecimento é obrigatório');
      setMensagemTipo('erro');
      return;
    }

    if (!logradouro.trim() || !numero.trim() || !cidade.trim() || !uf.trim()) {
      setMensagemErro('⚠️ Preencha todos os campos obrigatórios do endereço');
      setMensagemTipo('erro');
      return;
    }

    setSalvando(true);
    setMensagem('');
    setMensagemErro('');

    try {
      const enderecoCompletoFormatado = [
        logradouro.trim(),
        numero.trim(),
        complemento.trim() ? `- ${complemento.trim()}` : '',
        bairro.trim() ? `, ${bairro.trim()}` : '',
        `${cidade.trim()} - ${uf.trim().toUpperCase()}`,
        cep.trim() ? `CEP: ${cep.trim()}` : ''
      ].filter(Boolean).join(' ');

      const dados = {
        nome: nomeEstabelecimento.trim(),
        telefone: telefone.trim(),
        email: email.trim(),
        uf: uf.trim().toUpperCase(),
        cidade: cidade.trim(),
        bairro: bairro.trim(),
        logradouro: logradouro.trim(),
        numero: numero.trim(),
        complemento: complemento.trim(),
        cep: cep.trim(),
        enderecoCompleto: enderecoCompletoFormatado,
        lat: coordenadasMapa ? coordenadasMapa[0] : null,
        lon: coordenadasMapa ? coordenadasMapa[1] : null,
        atualizadoEm: serverTimestamp()
      };

      const docRef = doc(db, "estabelecimentos", estabelecimentoId);
      await setDoc(docRef, dados, { merge: true });

      setMensagem('✅ Dados salvos com sucesso!');
      setMensagemTipo('sucesso');
      setMensagemErro('');
      setEnderecoCompleto(enderecoCompletoFormatado);

      if (onDadosSalvos) {
        onDadosSalvos(dados);
      }

      setTimeout(() => setMensagem(''), 5000);
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
      setMensagemErro('❌ Erro ao salvar dados. Tente novamente.');
      setMensagemTipo('erro');
    } finally {
      setSalvando(false);
    }
  };

  // ============================================
  // RENDER MAPA
  // ============================================
  const renderMapa = () => {
    return (
      <div className="mapa-wrapper">
        <MapContainer
          center={coordenadasMapa || [-22.0089, -47.8906]}
          zoom={coordenadasMapa ? 17 : 13}
          style={{ height: '100%', width: '100%' }}
        >
          <LayersControl position="topright">
            <BaseLayer checked name="Híbrido (Satélite + Ruas)">
              <MapaHibrido />
            </BaseLayer>
            <BaseLayer name="Satélite">
              <TileLayer
                attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              />
            </BaseLayer>
            <BaseLayer name="Ruas">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            </BaseLayer>
          </LayersControl>

          <SearchControl 
            onEnderecoEncontrado={handleEnderecoEncontrado}
            onCarregando={setCarregandoMapa}
            onErro={setErroMapa}
          />

          {coordenadasMapa && (
            <Marker position={coordenadasMapa}>
              <Popup>
                <strong>📍 {nomeEstabelecimento || 'Seu Estabelecimento'}</strong><br />
                {enderecoCompleto || 'Endereço configurado'}
              </Popup>
            </Marker>
          )}

          {coordenadasMapa && <CenterMap coordenadas={coordenadasMapa} />}
        </MapContainer>

        <div className="mapa-preview-info">
          {carregandoMapa ? (
            <span>⏳ Carregando...</span>
          ) : coordenadasMapa ? (
            <>
              <span>📍 Localização definida</span>
              <span className="mapa-preview-coords">
                {coordenadasMapa[0].toFixed(6)}°, {coordenadasMapa[1].toFixed(6)}°
              </span>
            </>
          ) : (
            <span className="mapa-preview-hint">🔍 Pesquise o endereço no mapa acima</span>
          )}
        </div>
      </div>
    );
  };

  // ============================================
  // RENDER
  // ============================================
  if (carregando) {
    return (
      <div className="meus-dados-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Carregando dados do estabelecimento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="meus-dados-container">
      <div className="meus-dados-header">
        <h2>⚙️ Meus Dados</h2>
        <p>Configure os dados do seu estabelecimento. Pesquise o endereço diretamente no mapa.</p>
      </div>

      <div className="meus-dados-form">
        {/* Informações Básicas */}
        <div className="form-section">
          <div className="section-titulo">📋 Informações do Estabelecimento</div>
          <div className="form-grid">
            <div className="form-campo-full">
              <label className="field-label">
                Nome do Estabelecimento <span className="field-required">*</span>
              </label>
              <input
                type="text"
                value={nomeEstabelecimento}
                onChange={(e) => setNomeEstabelecimento(e.target.value)}
                placeholder="Ex: Restaurante Sabor & Arte"
                className="field-input"
              />
            </div>

            <div className="form-campo">
              <label className="field-label">Telefone / WhatsApp</label>
              <input
                type="tel"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(16) 99999-9999"
                className="field-input"
              />
            </div>

            <div className="form-campo">
              <label className="field-label">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contato@restaurante.com"
                className="field-input"
              />
            </div>
          </div>
        </div>

        {/* MAPA */}
        <div className="form-section mapa-section">
          <div className="section-titulo">🗺️ Localize seu Estabelecimento</div>
          <div className="mapa-preview-container">
            {renderMapa()}
          </div>
          <p className="mapa-hint">
            💡 Digite o endereço na barra de pesquisa do mapa e clique no resultado para preencher automaticamente os campos abaixo.
          </p>
        </div>

        {/* Endereço */}
        <div className="form-section">
          <div className="section-titulo">📍 Endereço de Coleta</div>
          <div className="form-grid-endereco">
            <div className="endereco-campo-uf">
              <label className="field-label">
                UF <span className="field-required">*</span>
              </label>
              <input
                type="text"
                value={uf}
                onChange={(e) => setUf(e.target.value)}
                placeholder="SP"
                className={`field-input ${coordenadasMapa ? 'field-auto' : ''}`}
                maxLength={2}
              />
            </div>

            <div className="endereco-campo-cidade">
              <label className="field-label">
                Cidade <span className="field-required">*</span>
              </label>
              <input
                type="text"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                placeholder="São Paulo"
                className={`field-input ${coordenadasMapa ? 'field-auto' : ''}`}
              />
            </div>

            <div className="endereco-campo-bairro">
              <label className="field-label">Bairro</label>
              <input
                type="text"
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
                placeholder="Centro"
                className="field-input"
              />
            </div>

            <div className="endereco-campo-logradouro">
              <label className="field-label">
                Logradouro <span className="field-required">*</span>
              </label>
              <input
                type="text"
                value={logradouro}
                onChange={(e) => setLogradouro(e.target.value)}
                placeholder="Rua, Avenida..."
                className={`field-input ${coordenadasMapa ? 'field-auto' : ''}`}
              />
            </div>

            <div className="endereco-campo-numero">
              <label className="field-label">
                Número <span className="field-required">*</span>
              </label>
              <input
                type="text"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                placeholder="Nº"
                className={`field-input ${coordenadasMapa ? 'field-auto' : ''}`}
              />
            </div>

            <div className="endereco-campo-complemento">
              <label className="field-label">Complemento</label>
              <input
                type="text"
                value={complemento}
                onChange={(e) => setComplemento(e.target.value)}
                placeholder="Apto, bloco, sala..."
                className="field-input"
              />
            </div>

            <div className="endereco-campo-cep">
              <label className="field-label">CEP</label>
              <input
                type="text"
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                placeholder="00000-000"
                className="field-input"
                maxLength={9}
              />
            </div>
          </div>

          {uf && cidade && logradouro && numero && (
            <div className="endereco-preview">
              <span className="preview-label">📌 Endereço completo:</span>
              <span className="preview-endereco">
                {logradouro}, {numero}
                {complemento ? ` - ${complemento}` : ''}
                {bairro ? `, ${bairro}` : ''}
                , {cidade} - {uf.toUpperCase()}
                {cep ? `, CEP: ${cep}` : ''}
              </span>
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="form-actions">
          {mensagem && (
            <div className={`mensagem ${mensagemTipo === 'sucesso' ? 'mensagem-sucesso' : 'mensagem-erro'}`}>
              {mensagem}
            </div>
          )}
          {mensagemErro && (
            <div className="mensagem mensagem-erro">{mensagemErro}</div>
          )}
          <button
            onClick={salvarDados}
            disabled={salvando}
            className="btn-salvar-dados"
          >
            {salvando ? '⏳ Salvando...' : '💾 Salvar Dados'}
          </button>
        </div>
      </div>

      <style>{`
        /* ============================================ */
        /* ESTILOS COMPLETOS MEUS DADOS                */
        /* ============================================ */
        
        .meus-dados-container {
          padding: 30px;
          max-width: 950px;
          margin: 0 auto;
          width: 100%;
          box-sizing: border-box;
        }

        .meus-dados-header {
          margin-bottom: 30px;
        }

        .meus-dados-header h2 {
          font-size: 28px;
          font-weight: 700;
          color: #212121;
          margin: 0 0 8px 0;
        }

        .meus-dados-header p {
          color: #757575;
          font-size: 15px;
          margin: 0;
        }

        .meus-dados-form {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(15px);
          -webkit-backdrop-filter: blur(15px);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
          padding: 30px;
          box-sizing: border-box;
        }

        .form-section {
          margin-bottom: 28px;
          padding-bottom: 28px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        }

        .form-section:last-child {
          border-bottom: none;
          margin-bottom: 0;
          padding-bottom: 0;
        }

        .section-titulo {
          font-weight: 600;
          font-size: 16px;
          color: #757575;
          margin-bottom: 16px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .form-grid {
          display: grid;
          gap: 16px 20px;
          grid-template-columns: 1fr 1fr;
        }

        .form-grid-endereco {
          display: grid;
          gap: 12px 16px;
          grid-template-columns: repeat(6, 1fr);
        }

        .form-campo {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .form-campo-full {
          grid-column: span 2;
        }

        .endereco-campo-uf { grid-column: span 1; }
        .endereco-campo-cidade { grid-column: span 2; }
        .endereco-campo-bairro { grid-column: span 1; }
        .endereco-campo-logradouro { grid-column: span 3; }
        .endereco-campo-numero { grid-column: span 1; }
        .endereco-campo-complemento { grid-column: span 1; }
        .endereco-campo-cep { grid-column: span 1; }

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

        .field-input {
          width: 100%;
          padding: 10px 14px;
          border-radius: 10px;
          border: 2px solid rgba(229, 57, 53, 0.15);
          font-size: 15px;
          transition: all 0.3s ease;
          background: rgba(255, 255, 255, 0.7);
          color: #212121;
          outline: none;
          box-sizing: border-box;
        }

        .field-input:focus {
          border-color: #E53935;
          background: #FFFFFF;
          box-shadow: 0 0 0 4px rgba(229, 57, 53, 0.08);
        }

        .field-input.field-auto {
          background: rgba(229, 57, 53, 0.04);
          border-color: rgba(229, 57, 53, 0.08);
        }

        .field-input.field-auto:focus {
          background: #FFFFFF;
        }

        /* Preview Endereço */
        .endereco-preview {
          margin-top: 16px;
          padding: 12px 16px;
          background: rgba(229, 57, 53, 0.05);
          border-radius: 10px;
          border-left: 4px solid #E53935;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
        }

        .preview-label {
          font-weight: 600;
          font-size: 14px;
          color: #424242;
        }

        .preview-endereco {
          font-size: 14px;
          color: #212121;
          font-weight: 500;
        }

        /* MAPA */
        .mapa-section {
          padding-bottom: 20px;
        }

        .mapa-preview-container {
          height: 420px;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
          background: #f0ebe6;
          position: relative;
        }

        .mapa-wrapper {
          height: 100%;
          width: 100%;
          position: relative;
        }

        .leaflet-container {
          height: 100% !important;
          width: 100% !important;
        }

        /* Barra de Pesquisa */
        .search-control-container {
          position: absolute;
          top: 12px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1000;
          width: 90%;
          max-width: 500px;
        }

        .search-input-wrapper {
          display: flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
          padding: 0 12px;
          transition: all 0.3s ease;
        }

        .search-input-wrapper:focus-within {
          box-shadow: 0 4px 20px rgba(229, 57, 53, 0.15);
          border-color: #E53935;
        }

        .search-icon {
          font-size: 16px;
          color: #9E9E9E;
          margin-right: 8px;
        }

        .search-input {
          flex: 1;
          padding: 12px 8px;
          border: none;
          outline: none;
          font-size: 15px;
          background: transparent;
          color: #212121;
          font-weight: 500;
        }

        .search-input::placeholder {
          color: #BDBDBD;
          font-weight: 400;
        }

        .search-loading {
          font-size: 16px;
          animation: spin 1s linear infinite;
          color: #E53935;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .search-results {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          right: 0;
          max-height: 280px;
          overflow-y: auto;
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(20px);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
          padding: 4px 0;
        }

        .search-result-item {
          padding: 12px 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          border-bottom: 1px solid rgba(0, 0, 0, 0.04);
        }

        .search-result-item:last-child {
          border-bottom: none;
        }

        .search-result-item:hover {
          background: rgba(229, 57, 53, 0.05);
        }

        .search-result-main {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .search-result-icon {
          font-size: 16px;
        }

        .search-result-nome {
          font-weight: 600;
          color: #212121;
          font-size: 14px;
        }

        .search-result-detalhe {
          font-size: 12px;
          color: #757575;
          margin-top: 2px;
          padding-left: 26px;
        }

        .search-result-empty {
          padding: 24px 16px;
          text-align: center;
        }

        .search-result-empty span {
          font-size: 32px;
          display: block;
          margin-bottom: 8px;
        }

        .search-result-empty p {
          color: #757575;
          font-size: 14px;
          margin: 4px 0;
        }

        .search-result-hint {
          font-size: 12px !important;
          color: #9E9E9E !important;
        }

        .search-results::-webkit-scrollbar {
          width: 6px;
        }
        .search-results::-webkit-scrollbar-track {
          background: transparent;
        }
        .search-results::-webkit-scrollbar-thumb {
          background: #BDBDBD;
          border-radius: 3px;
        }

        /* Info do Mapa */
        .mapa-preview-info {
          position: absolute;
          bottom: 12px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(10px);
          color: #fff;
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 12px;
          display: flex;
          gap: 12px;
          align-items: center;
          white-space: nowrap;
          z-index: 1000;
        }

        .mapa-preview-coords {
          color: #FBC02D;
          font-weight: 500;
        }

        .mapa-preview-hint {
          color: #BDBDBD;
        }

        .leaflet-control-layers {
          background: rgba(255, 255, 255, 0.9) !important;
          backdrop-filter: blur(10px);
          border-radius: 8px !important;
          border: 1px solid rgba(255, 255, 255, 0.3) !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
        }

        .leaflet-control-layers label {
          font-size: 13px;
          font-weight: 500;
          color: #424242;
        }

        .leaflet-control-layers input[type="radio"] {
          accent-color: #E53935;
        }

        .mapa-hint {
          margin-top: 10px;
          font-size: 13px;
          color: #9E9E9E;
          text-align: center;
        }

        /* Ações */
        .form-actions {
          margin-top: 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .mensagem {
          padding: 12px 16px;
          border-radius: 8px;
          font-weight: 500;
          font-size: 14px;
        }

        .mensagem-sucesso {
          background: rgba(46, 125, 50, 0.08);
          border-left: 4px solid #2E7D32;
          color: #1B5E20;
        }

        .mensagem-erro {
          background: rgba(229, 57, 53, 0.08);
          border-left: 4px solid #E53935;
          color: #C62828;
        }

        .btn-salvar-dados {
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
          align-self: flex-start;
        }

        .btn-salvar-dados:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(229, 57, 53, 0.35);
        }

        .btn-salvar-dados:disabled {
          background: #BDBDBD;
          box-shadow: none;
          cursor: not-allowed;
          opacity: 0.7;
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

        /* Responsivo */
        @media (max-width: 1024px) {
          .form-grid-endereco {
            grid-template-columns: repeat(4, 1fr);
          }
          .endereco-campo-uf { grid-column: span 1; }
          .endereco-campo-cidade { grid-column: span 3; }
          .endereco-campo-bairro { grid-column: span 2; }
          .endereco-campo-logradouro { grid-column: span 2; }
          .endereco-campo-numero { grid-column: span 1; }
          .endereco-campo-complemento { grid-column: span 2; }
          .endereco-campo-cep { grid-column: span 2; }
        }

        @media (max-width: 768px) {
          .meus-dados-container {
            padding: 16px;
          }

          .meus-dados-form {
            padding: 20px;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .form-campo-full {
            grid-column: span 1;
          }

          .form-grid-endereco {
            grid-template-columns: 1fr;
          }
          .endereco-campo-uf,
          .endereco-campo-cidade,
          .endereco-campo-bairro,
          .endereco-campo-logradouro,
          .endereco-campo-numero,
          .endereco-campo-complemento,
          .endereco-campo-cep {
            grid-column: span 1;
          }

          .btn-salvar-dados {
            width: 100%;
            text-align: center;
          }

          .endereco-preview {
            flex-direction: column;
            align-items: flex-start;
          }

          .mapa-preview-container {
            height: 350px;
          }

          .mapa-preview-info {
            font-size: 10px;
            padding: 4px 12px;
            white-space: normal;
            flex-wrap: wrap;
            justify-content: center;
            bottom: 8px;
          }

          .search-control-container {
            width: 95%;
            max-width: none;
          }

          .search-input {
            font-size: 14px;
            padding: 10px 6px;
          }

          .search-results {
            max-height: 200px;
          }
        }

        @media (max-width: 480px) {
          .meus-dados-header h2 {
            font-size: 22px;
          }

          .meus-dados-form {
            padding: 16px;
          }

          .field-input {
            font-size: 14px;
            padding: 10px 12px;
          }

          .mapa-preview-container {
            height: 300px;
          }

          .search-input {
            font-size: 13px;
          }

          .search-result-nome {
            font-size: 13px;
          }

          .search-result-detalhe {
            font-size: 11px;
          }
        }
      `}</style>
    </div>
  );
}