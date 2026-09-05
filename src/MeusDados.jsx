// ============================================
// MEUSDADOS.JSX - FONTES OTIMIZADAS PARA ZOOM 100%
// ============================================
import { useCallback, useEffect, useRef, useState } from 'react';
import { db } from './firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { LoadScript, GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';

// ============================================
// CONSTANTES
// ============================================
const GOOGLE_MAPS_API_KEY = 'AIzaSyBQkWPT9Suz_x-jqM_FBMFdndTvGcrwjBE';

const ESTADOS_BRASIL = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 
  'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 
  'SP', 'SE', 'TO'
];

// ============================================
// ESTILOS DO MAPA
// ============================================
const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

// ============================================
// COMPONENTE: GoogleMap (API tradicional)
// ============================================
function GoogleMapComponent({ 
  center, 
  zoom, 
  markerPosition, 
  onMarkerDragEnd,
  onPlaceSelect,
  nomeEstabelecimento,
  endereco,
  setMapInstance 
}) {
  const [map, setMap] = useState(null);
  const [infoWindowOpen, setInfoWindowOpen] = useState(true);
  const searchInputRef = useRef(null);

  const onMapLoad = useCallback((mapInstance) => {
    setMap(mapInstance);
    if (setMapInstance) {
      setMapInstance(mapInstance);
    }

    if (searchInputRef.current && window.google) {
      const searchBox = new window.google.maps.places.SearchBox(searchInputRef.current);
      
      searchBox.addListener('places_changed', () => {
        const places = searchBox.getPlaces();
        if (places && places.length > 0) {
          const place = places[0];
          if (place.geometry) {
            const location = place.geometry.location;
            
            mapInstance.panTo(location);
            mapInstance.setZoom(17);
            
            if (onPlaceSelect) {
              onPlaceSelect({
                lat: location.lat(),
                lng: location.lng(),
                formattedAddress: place.formatted_address,
                displayName: place.name,
              });
            }
            
            setInfoWindowOpen(true);
          }
        }
      });
    }
  }, [setMapInstance, onPlaceSelect]);

  useEffect(() => {
    if (map && center) {
      map.panTo({ lat: center[0], lng: center[1] });
      if (zoom) {
        map.setZoom(zoom);
      }
    }
  }, [map, center, zoom]);

  useEffect(() => {
    if (markerPosition && map) {
      map.panTo({ lat: markerPosition[0], lng: markerPosition[1] });
      map.setZoom(17);
      setInfoWindowOpen(true);
    }
  }, [markerPosition, map]);

  const handleMarkerDragEnd = useCallback((event) => {
    const position = event.latLng;
    const coords = [position.lat(), position.lng()];
    if (onMarkerDragEnd) {
      onMarkerDragEnd(coords);
    }
    setInfoWindowOpen(true);
  }, [onMarkerDragEnd]);

  const mapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    zoomControlOptions: {
      position: window.google?.maps?.ControlPosition?.RIGHT_CENTER || 1,
    },
    mapTypeControl: true,
    mapTypeControlOptions: {
      position: window.google?.maps?.ControlPosition?.TOP_RIGHT || 1,
      style: window.google?.maps?.MapTypeControlStyle?.HORIZONTAL_BAR || 0,
      mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain'],
    },
    streetViewControl: true,
    streetViewControlOptions: {
      position: window.google?.maps?.ControlPosition?.RIGHT_BOTTOM || 1,
    },
    fullscreenControl: true,
    fullscreenControlOptions: {
      position: window.google?.maps?.ControlPosition?.RIGHT_BOTTOM || 1,
    },
    mapTypeId: 'hybrid',
  };

  return (
    <div className="mapa-wrapper">
      <div className="search-box-container">
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Pesquisar no mapa"
          className="search-box-input"
        />
        <button className="search-box-button">
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path fill="#5f6368" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
        </button>
      </div>

      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center ? { lat: center[0], lng: center[1] } : { lat: -14.235, lng: -51.925 }}
        zoom={zoom || 4}
        options={mapOptions}
        onLoad={onMapLoad}
      >
        {markerPosition && (
          <Marker
            position={{ lat: markerPosition[0], lng: markerPosition[1] }}
            draggable={true}
            onDragEnd={handleMarkerDragEnd}
            onClick={() => setInfoWindowOpen(!infoWindowOpen)}
          />
        )}

        {markerPosition && infoWindowOpen && (
          <InfoWindow
            position={{ lat: markerPosition[0], lng: markerPosition[1] }}
            onCloseClick={() => setInfoWindowOpen(false)}
          >
            <div className="info-window-content">
              <div className="info-window-title">
                {nomeEstabelecimento || '📍 Local selecionado'}
              </div>
              <div className="info-window-address">
                {endereco || 'Arraste o marcador para ajustar'}
              </div>
              <div className="info-window-hint">
                🖱️ Arraste o marcador para ajustar
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}

// ============================================
// COMPONENTE PRINCIPAL: MeusDados
// ============================================
export default function MeusDados({ estabelecimentoId, onDadosSalvos }) {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [mensagemTipo, setMensagemTipo] = useState('sucesso');
  const [mensagemErro, setMensagemErro] = useState('');
  const [mapInstance, setMapInstance] = useState(null);
  const [abaAtiva, setAbaAtiva] = useState('formulario');

  // Estados do Formulário
  const [nomeEstabelecimento, setNomeEstabelecimento] = useState('');
  const [telefone, setTelefone] = useState('');
  const [uf, setUf] = useState('');
  const [cidade, setCidade] = useState('');
  const [cidadesFiltradas, setCidadesFiltradas] = useState([]);
  const [mostrarSugestoesCidade, setMostrarSugestoesCidade] = useState(false);
  const [bairro, setBairro] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [cep, setCep] = useState('');

  // Estados do Mapa
  const [coordenadasSalvas, setCoordenadasSalvas] = useState(null);
  const [coordenadasAtuais, setCoordenadasAtuais] = useState(null);
  const [zoomMapa, setZoomMapa] = useState(4);
  const [centroMapa, setCentroMapa] = useState([-14.235, -51.925]);
  const [buscandoCep, setBuscandoCep] = useState(false);

  const cidadeInputRef = useRef(null);
  const cidadeResultsRef = useRef(null);
  const cepTimeoutRef = useRef(null);

  // ============================================
  // BUSCAR CEP (ViaCEP)
  // ============================================
  const buscarCep = async (cepInput) => {
    const cepLimpo = cepInput.replace(/\D/g, '');
    
    if (cepLimpo.length !== 8) {
      return;
    }

    setBuscandoCep(true);
    setMensagem('');

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      
      if (!response.ok) throw new Error('Erro ao buscar CEP');
      
      const data = await response.json();
      
      if (data.erro) {
        setMensagemErro('⚠️ CEP não encontrado');
        setMensagemTipo('erro');
        return;
      }

      if (data.uf) setUf(data.uf);
      if (data.localidade) setCidade(data.localidade);
      if (data.bairro) setBairro(data.bairro);
      if (data.logradouro) setLogradouro(data.logradouro);
      if (data.cep) {
        setCep(data.cep.replace(/(\d{5})(\d{3})/, '$1-$2'));
      }

      if (data.logradouro && data.localidade && data.uf && window.google) {
        const geocoder = new window.google.maps.Geocoder();
        const enderecoBusca = `${data.logradouro}, ${data.localidade}, ${data.uf}, Brasil`;
        
        geocoder.geocode(
          { address: enderecoBusca, region: 'br' },
          (results, status) => {
            if (status === 'OK' && results && results.length > 0) {
              const location = results[0].geometry.location;
              const coords = [location.lat(), location.lng()];
              setCoordenadasAtuais(coords);
              setCentroMapa(coords);
              setZoomMapa(17);
              
              if (mapInstance) {
                mapInstance.panTo(location);
                mapInstance.setZoom(17);
              }
            }
          }
        );
      }

      setMensagem('✅ CEP localizado! Verifique os dados.');
      setMensagemTipo('sucesso');
      setTimeout(() => setMensagem(''), 5000);
      setMensagemErro('');
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      setMensagemErro('❌ Erro ao buscar CEP. Tente novamente.');
      setMensagemTipo('erro');
    } finally {
      setBuscandoCep(false);
    }
  };

  // ============================================
  // BUSCAR CIDADES POR UF (IBGE)
  // ============================================
  const buscarCidadesPorUF = useCallback(async (siglaUF) => {
    if (!siglaUF || siglaUF.length !== 2) {
      setCidadesFiltradas([]);
      return;
    }

    try {
      const response = await fetch(
        `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${siglaUF}/municipios?orderBy=nome`
      );
      
      if (!response.ok) throw new Error('Erro ao buscar cidades');
      
      const data = await response.json();
      setCidadesFiltradas(data.map(item => item.nome));
    } catch (error) {
      console.error('Erro ao buscar cidades:', error);
      setCidadesFiltradas([]);
    }
  }, []);

  // ============================================
  // CARREGAR DADOS DO BANCO
  // ============================================
  const carregarDados = async () => {
    if (!estabelecimentoId) return;
    setCarregando(true);
    try {
      const docSnap = await getDoc(doc(db, 'estabelecimentos', estabelecimentoId));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setNomeEstabelecimento(data.nome || '');
        setTelefone(data.telefone || '');
        setUf(data.uf || '');
        setCidade(data.cidade || '');
        setBairro(data.bairro || '');
        setLogradouro(data.logradouro || '');
        setNumero(data.numero || '');
        setComplemento(data.complemento || '');
        setCep(data.cep || '');

        if (data.lat && data.lon) {
          const coordsSalvas = [data.lat, data.lon];
          setCoordenadasSalvas(coordsSalvas);
          setCoordenadasAtuais(coordsSalvas);
          setZoomMapa(17);
          setCentroMapa([data.lat, data.lon]);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setCarregando(false);
    }
  };

  // ============================================
  // EFFECT: Carregar dados iniciais
  // ============================================
  useEffect(() => {
    carregarDados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estabelecimentoId]);

  // ============================================
  // EFFECT: Buscar cidades quando UF mudar
  // ============================================
  useEffect(() => {
    if (uf && uf.length === 2) {
      buscarCidadesPorUF(uf);
    } else {
      setCidadesFiltradas([]);
      setCidade('');
    }
  }, [uf, buscarCidadesPorUF]);

  // ============================================
  // EFFECT: Debounce para busca de CEP
  // ============================================
  useEffect(() => {
    if (cepTimeoutRef.current) clearTimeout(cepTimeoutRef.current);

    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length === 8) {
      cepTimeoutRef.current = setTimeout(() => {
        buscarCep(cep);
      }, 500);
    }

    return () => {
      if (cepTimeoutRef.current) clearTimeout(cepTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cep]);

  // ============================================
  // HANDLER: Selecionar cidade
  // ============================================
  const selecionarCidade = (cidadeSelecionada) => {
    setCidade(cidadeSelecionada);
    setMostrarSugestoesCidade(false);
    setCidadesFiltradas([]);
    setLogradouro('');
  };

  // ============================================
  // HANDLER: Posição do marcador ajustada
  // ============================================
  const handleMarkerPositionChange = (novaPosicao) => {
    setCoordenadasAtuais(novaPosicao);
    setMensagem('📍 Posição ajustada! Clique em Salvar para confirmar.');
    setMensagemTipo('info');
    setTimeout(() => setMensagem(''), 3000);
  };

  // ============================================
  // HANDLER: Lugar selecionado no SearchBox
  // ============================================
  const handlePlaceSelect = (place) => {
    const coords = [place.lat, place.lng];
    setCoordenadasAtuais(coords);
    setZoomMapa(17);
    setCentroMapa(coords);
    
    if (place.formattedAddress) {
      const partes = place.formattedAddress.split(',');
      if (partes.length > 0) {
        const logradouroPart = partes[0].trim();
        if (logradouroPart && !logradouro) {
          setLogradouro(logradouroPart);
        }
      }
    }
    
    setMensagem('✅ Endereço localizado com precisão!');
    setMensagemTipo('sucesso');
    setTimeout(() => setMensagem(''), 5000);
  };

  // ============================================
  // HANDLER: Formatação do CEP
  // ============================================
  const formatarCep = (valor) => {
    const numeros = valor.replace(/\D/g, '');
    if (numeros.length === 0) return '';
    if (numeros.length <= 5) return numeros;
    return `${numeros.slice(0, 5)}-${numeros.slice(5, 8)}`;
  };

  const handleCepChange = (e) => {
    const valor = e.target.value;
    const apenasNumeros = valor.replace(/\D/g, '');
    if (apenasNumeros.length <= 8) {
      setCep(formatarCep(valor));
    }
  };

  // ============================================
  // HANDLER: Salvar dados
  // ============================================
  const salvarDados = async () => {
    if (!nomeEstabelecimento.trim()) {
      setMensagemErro('⚠️ Nome do estabelecimento é obrigatório');
      return;
    }

    if (!uf || uf.length !== 2) {
      setMensagemErro('⚠️ Selecione um estado (UF)');
      return;
    }

    if (!cidade.trim()) {
      setMensagemErro('⚠️ Selecione uma cidade');
      return;
    }

    if (!logradouro.trim()) {
      setMensagemErro('⚠️ Informe o logradouro');
      return;
    }

    if (!numero.trim()) {
      setMensagemErro('⚠️ Informe o número');
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
        `${cidade.trim()} - ${uf.trim().toUpperCase()}`
      ].filter(Boolean).join(' ');

      let lat = null;
      let lon = null;

      if (coordenadasAtuais) {
        lat = coordenadasAtuais[0];
        lon = coordenadasAtuais[1];
      }

      const dados = {
        nome: nomeEstabelecimento.trim(),
        telefone: telefone.trim(),
        uf: uf.trim().toUpperCase(),
        cidade: cidade.trim(),
        bairro: bairro.trim(),
        logradouro: logradouro.trim(),
        numero: numero.trim(),
        complemento: complemento.trim(),
        cep: cep.trim(),
        enderecoCompleto: enderecoCompletoFormatado,
        lat: lat,
        lon: lon,
        atualizadoEm: serverTimestamp()
      };

      const docRef = doc(db, "estabelecimentos", estabelecimentoId);
      await setDoc(docRef, dados, { merge: true });

      if (lat && lon) {
        const coordsSalvas = [lat, lon];
        setCoordenadasSalvas(coordsSalvas);
        setCoordenadasAtuais(coordsSalvas);
        setZoomMapa(17);
        setCentroMapa([lat, lon]);
      }

      setMensagem('✅ Dados salvos com sucesso!');
      setMensagemTipo('sucesso');
      setMensagemErro('');

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
  // FORMATAR TELEFONE
  // ============================================
  const formatarTelefone = (valor) => {
    const numeros = valor.replace(/\D/g, '');
    if (numeros.length === 0) return '';
    if (numeros.length <= 2) return `(${numeros}`;
    if (numeros.length <= 3) return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
    if (numeros.length <= 7) return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 3)} ${numeros.slice(3)}`;
    if (numeros.length <= 11) return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 3)} ${numeros.slice(3, 7)}-${numeros.slice(7)}`;
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 3)} ${numeros.slice(3, 7)}-${numeros.slice(7, 11)}`;
  };

  const handleTelefoneChange = (e) => {
    const valor = e.target.value;
    const apenasNumeros = valor.replace(/\D/g, '');
    if (apenasNumeros.length <= 11) {
      setTelefone(formatarTelefone(valor));
    }
  };

  // ============================================
  // RENDER MAPA
  // ============================================
  const renderMapa = () => {
    const posicaoFinal = coordenadasAtuais || coordenadasSalvas;

    return (
      <LoadScript
        googleMapsApiKey={GOOGLE_MAPS_API_KEY}
        libraries={['places']}
        onLoad={() => setIsScriptLoaded(true)}
      >
        <GoogleMapComponent
          center={posicaoFinal || centroMapa}
          zoom={posicaoFinal ? 17 : zoomMapa}
          markerPosition={posicaoFinal}
          onMarkerDragEnd={handleMarkerPositionChange}
          onPlaceSelect={handlePlaceSelect}
          nomeEstabelecimento={nomeEstabelecimento}
          endereco={`${logradouro}, ${numero} - ${cidade}`}
          setMapInstance={setMapInstance}
        />
      </LoadScript>
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
        <div className="header-content">
          <h2>⚙️ Meus Dados</h2>
          <p>Configure os dados do seu estabelecimento e localização no mapa</p>
        </div>
      </div>

      <div className="abas-container">
        <button 
          className={`aba-btn ${abaAtiva === 'formulario' ? 'aba-ativa' : ''}`}
          onClick={() => setAbaAtiva('formulario')}
        >
          <span>📋</span> Formulário
        </button>
        <button 
          className={`aba-btn ${abaAtiva === 'mapa' ? 'aba-ativa' : ''}`}
          onClick={() => setAbaAtiva('mapa')}
        >
          <span>🗺️</span> Mapa
        </button>
      </div>

      <div className="meus-dados-form">
        <div className={`aba-conteudo ${abaAtiva === 'formulario' ? 'aba-visible' : 'aba-hidden'}`}>
          <div className="form-section">
            <div className="section-titulo">
              <span>📋</span> Informações do Estabelecimento
            </div>
            <div className="form-grid">
              <div className="form-campo-full">
                <label className="field-label">
                  Nome do Estabelecimento <span className="field-required">*</span>
                </label>
                <input
                  type="text"
                  value={nomeEstabelecimento}
                  onChange={(e) => setNomeEstabelecimento(e.target.value)}
                  placeholder="Ex: Tradição Gaúcha Lanches e Pizzas"
                  className="field-input"
                />
              </div>

              <div className="form-campo">
                <label className="field-label">Telefone / WhatsApp</label>
                <input
                  type="tel"
                  value={telefone}
                  onChange={handleTelefoneChange}
                  placeholder="(00) 0 0000-0000"
                  className="field-input"
                  maxLength={16}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="section-titulo">
              <span>📍</span> Endereço de Coleta
            </div>
            
            <div className="form-grid-cep">
              <div className="endereco-campo-cep">
                <label className="field-label">
                  CEP <span className="field-hint">(Prioritário para precisão)</span>
                </label>
                <div className="cep-input-wrapper">
                  <input
                    type="text"
                    value={cep}
                    onChange={handleCepChange}
                    placeholder="00000-000"
                    className="field-input"
                    maxLength={9}
                  />
                  {buscandoCep && <span className="cep-loading">⏳</span>}
                </div>
                <p className="cep-hint">Digite o CEP para preencher automaticamente os campos</p>
              </div>
            </div>

            <div className="form-grid-endereco">
              <div className="endereco-campo-uf">
                <label className="field-label">
                  UF <span className="field-required">*</span>
                </label>
                <select
                  value={uf}
                  onChange={(e) => setUf(e.target.value)}
                  className="field-input"
                >
                  <option value="">Selecione</option>
                  {ESTADOS_BRASIL.map((sigla) => (
                    <option key={sigla} value={sigla}>{sigla}</option>
                  ))}
                </select>
              </div>

              <div className="endereco-campo-cidade">
                <label className="field-label">
                  Cidade <span className="field-required">*</span>
                </label>
                <div className="autocomplete-wrapper" ref={cidadeResultsRef}>
                  <input
                    ref={cidadeInputRef}
                    type="text"
                    value={cidade}
                    onChange={(e) => {
                      setCidade(e.target.value);
                      if (e.target.value.length > 0 && cidadesFiltradas.length > 0) {
                        const filtradas = cidadesFiltradas.filter(c => 
                          c.toLowerCase().includes(e.target.value.toLowerCase())
                        );
                        if (filtradas.length > 0) {
                          setCidadesFiltradas(filtradas);
                          setMostrarSugestoesCidade(true);
                        } else {
                          setMostrarSugestoesCidade(false);
                        }
                      } else {
                        setMostrarSugestoesCidade(false);
                      }
                    }}
                    onFocus={() => {
                      if (cidade && cidadesFiltradas.length > 0) {
                        const filtradas = cidadesFiltradas.filter(c => 
                          c.toLowerCase().includes(cidade.toLowerCase())
                        );
                        if (filtradas.length > 0) {
                          setCidadesFiltradas(filtradas);
                          setMostrarSugestoesCidade(true);
                        }
                      }
                    }}
                    placeholder={uf ? "Digite a cidade..." : "Selecione um estado primeiro"}
                    className="field-input"
                    disabled={!uf}
                  />
                  {mostrarSugestoesCidade && cidadesFiltradas.length > 0 && (
                    <div className="autocomplete-results">
                      {cidadesFiltradas.slice(0, 10).map((cidadeNome) => (
                        <div
                          key={cidadeNome}
                          className="autocomplete-item"
                          onClick={() => selecionarCidade(cidadeNome)}
                        >
                          {cidadeNome}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
                  className="field-input"
                  disabled={!cidade}
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
                  className="field-input"
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

          <div className="form-actions">
            {mensagem && (
              <div className={`mensagem mensagem-${mensagemTipo || 'sucesso'}`}>
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

        <div className={`aba-conteudo ${abaAtiva === 'mapa' ? 'aba-visible' : 'aba-hidden'}`}>
          <div className="form-section mapa-section">
            <div className="section-titulo">
              <span>🗺️</span> Localização no Mapa
            </div>
            <div className="mapa-preview-container">
              {renderMapa()}
            </div>
            <p className="mapa-hint">
              🔍 <strong>Pesquise no mapa</strong> ou preencha o formulário acima.
              <strong> Arraste o marcador </strong> para ajustar a localização exata.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        /* ============================================ */
        /* ESTILOS - FONTES OTIMIZADAS ZOOM 100%        */
        /* ============================================ */
        
        .meus-dados-container {
          padding: 24px;
          max-width: 1100px;
          margin: 0 auto;
          width: 100%;
          box-sizing: border-box;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        /* HEADER */
        .meus-dados-header {
          margin-bottom: 20px;
          padding: 18px 24px;
          background: #f8f9fa;
          border-radius: 12px;
          border: 1px solid #e9ecef;
        }

        .meus-dados-header h2 {
          font-size: 20px;
          font-weight: 600;
          color: #1a1a2e;
          margin: 0 0 4px 0;
        }

        .meus-dados-header p {
          color: #6b7280;
          font-size: 13px;
          margin: 0;
        }

        /* ABAS */
        .abas-container {
          display: flex;
          gap: 4px;
          background: #f1f3f5;
          border-radius: 10px;
          padding: 4px;
          margin-bottom: 20px;
          border: 1px solid #e9ecef;
        }

        .aba-btn {
          flex: 1;
          padding: 8px 16px;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          color: #6b7280;
          background: transparent;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .aba-btn:hover {
          color: #1a1a2e;
          background: rgba(229, 57, 53, 0.05);
        }

        .aba-btn.aba-ativa {
          background: #ffffff;
          color: #E53935;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
        }

        .aba-btn span {
          font-size: 16px;
        }

        .aba-conteudo {
          transition: all 0.3s ease;
        }

        .aba-visible {
          display: block;
          animation: fadeIn 0.25s ease;
        }

        .aba-hidden {
          display: none;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* FORMULÁRIO */
        .meus-dados-form {
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid #e9ecef;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
          padding: 24px;
          box-sizing: border-box;
        }

        .form-section {
          margin-bottom: 24px;
          padding-bottom: 24px;
          border-bottom: 1px solid #e9ecef;
        }

        .form-section:last-child {
          border-bottom: none;
          margin-bottom: 0;
          padding-bottom: 0;
        }

        .section-titulo {
          font-weight: 600;
          font-size: 13px;
          color: #1a1a2e;
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .section-titulo span {
          font-size: 16px;
        }

        .form-grid {
          display: grid;
          gap: 12px 16px;
          grid-template-columns: 1fr 1fr;
        }

        .form-grid-cep {
          display: grid;
          gap: 10px 16px;
          grid-template-columns: 1fr;
          margin-bottom: 12px;
        }

        .form-grid-endereco {
          display: grid;
          gap: 10px 14px;
          grid-template-columns: repeat(6, 1fr);
        }

        .form-campo {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .form-campo-full {
          grid-column: span 2;
        }

        .endereco-campo-cep { 
          grid-column: span 1;
          max-width: 280px;
        }
        .endereco-campo-uf { grid-column: span 1; }
        .endereco-campo-cidade { grid-column: span 2; }
        .endereco-campo-bairro { grid-column: span 1; }
        .endereco-campo-logradouro { grid-column: span 3; }
        .endereco-campo-numero { grid-column: span 1; }
        .endereco-campo-complemento { grid-column: span 1; }

        .field-label {
          display: block;
          font-weight: 600;
          margin-bottom: 3px;
          font-size: 12px;
          color: #374151;
        }

        .field-required {
          color: #E53935;
          font-weight: 700;
        }

        .field-hint {
          font-weight: 400;
          font-size: 10.5px;
          color: #9CA3AF;
          margin-left: 4px;
        }

        .field-input {
          width: 100%;
          padding: 8px 12px;
          border-radius: 8px;
          border: 1.5px solid #e9ecef;
          font-size: 13px;
          transition: all 0.2s ease;
          background: #fafbfc;
          color: #1a1a2e;
          outline: none;
          box-sizing: border-box;
          font-family: inherit;
          height: 38px;
        }

        .field-input:focus {
          border-color: #E53935;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(229, 57, 53, 0.08);
        }

        .field-input:disabled {
          background: #f1f3f5;
          color: #9CA3AF;
          cursor: not-allowed;
        }

        .field-input select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 32px;
        }

        .cep-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .cep-input-wrapper .field-input {
          padding-right: 36px;
        }

        .cep-loading {
          position: absolute;
          right: 10px;
          animation: spin 1s linear infinite;
          color: #E53935;
          font-size: 14px;
        }

        .cep-hint {
          font-size: 11px;
          color: #9CA3AF;
          margin: 3px 0 0 0;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* AUTOCOMPLETE */
        .autocomplete-wrapper {
          position: relative;
          width: 100%;
        }

        .autocomplete-results {
          position: absolute;
          top: calc(100% + 3px);
          left: 0;
          right: 0;
          max-height: 180px;
          overflow-y: auto;
          background: #ffffff;
          border-radius: 8px;
          border: 1px solid #e9ecef;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
          z-index: 1000;
          padding: 4px 0;
        }

        .autocomplete-item {
          padding: 8px 14px;
          cursor: pointer;
          transition: all 0.15s ease;
          border-bottom: 1px solid #f1f3f5;
          font-size: 13px;
          color: #1a1a2e;
        }

        .autocomplete-item:last-child {
          border-bottom: none;
        }

        .autocomplete-item:hover {
          background: rgba(229, 57, 53, 0.05);
          color: #E53935;
        }

        .autocomplete-results::-webkit-scrollbar {
          width: 5px;
        }
        .autocomplete-results::-webkit-scrollbar-track {
          background: transparent;
        }
        .autocomplete-results::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 3px;
        }

        /* PREVIEW ENDEREÇO */
        .endereco-preview {
          margin-top: 12px;
          padding: 10px 14px;
          background: #fef2f2;
          border-radius: 8px;
          border-left: 3px solid #E53935;
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          align-items: center;
        }

        .preview-label {
          font-weight: 600;
          font-size: 12px;
          color: #374151;
        }

        .preview-endereco {
          font-size: 13px;
          color: #1a1a2e;
          font-weight: 500;
        }

        /* MAPA */
        .mapa-section {
          padding-bottom: 16px;
        }

        .mapa-preview-container {
          height: 420px;
          border-radius: 10px;
          overflow: hidden;
          border: 1px solid #e9ecef;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          background: #f0ebe6;
          position: relative;
        }

        .mapa-wrapper {
          height: 100%;
          width: 100%;
          position: relative;
        }

        /* SEARCH BOX */
        .search-box-container {
          position: absolute;
          top: 10px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10;
          display: flex;
          align-items: center;
          background: white;
          border-radius: 20px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          max-width: 360px;
          width: 90%;
          height: 38px;
          transition: box-shadow 0.2s;
        }

        .search-box-container:hover,
        .search-box-container:focus-within {
          box-shadow: 0 4px 12px rgba(0,0,0,0.25);
        }

        .search-box-input {
          flex: 1;
          border: none;
          outline: none;
          padding: 0 12px;
          font-size: 13px;
          font-family: 'Roboto', Arial, sans-serif;
          color: #202124;
          background: transparent;
          height: 100%;
          border-radius: 20px;
        }

        .search-box-input::placeholder {
          color: #5f6368;
          font-size: 13px;
        }

        .search-box-button {
          background: transparent;
          border: none;
          padding: 0 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          border-radius: 0 20px 20px 0;
        }

        .search-box-button:hover {
          background: #f1f3f4;
        }

        /* INFO WINDOW */
        .info-window-content {
          padding: 2px 0;
          font-family: 'Roboto', Arial, sans-serif;
        }

        .info-window-title {
          font-size: 13px;
          font-weight: 500;
          color: #202124;
          margin-bottom: 2px;
        }

        .info-window-address {
          font-size: 11px;
          color: #5f6368;
          margin-bottom: 3px;
        }

        .info-window-hint {
          font-size: 10.5px;
          color: #1a73e8;
          margin-top: 3px;
        }

        .mapa-hint {
          margin-top: 10px;
          font-size: 12px;
          color: #6b7280;
          text-align: center;
          line-height: 1.5;
        }

        .mapa-hint strong {
          color: #E53935;
        }

        /* AÇÕES */
        .form-actions {
          margin-top: 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .mensagem {
          padding: 10px 14px;
          border-radius: 8px;
          font-weight: 500;
          font-size: 13px;
        }

        .mensagem-sucesso {
          background: #ecfdf5;
          border-left: 3px solid #059669;
          color: #065f46;
        }

        .mensagem-erro {
          background: #fef2f2;
          border-left: 3px solid #dc2626;
          color: #991b1b;
        }

        .mensagem-info {
          background: #eff6ff;
          border-left: 3px solid #2563eb;
          color: #1e40af;
        }

        .btn-salvar-dados {
          padding: 10px 28px;
          background: linear-gradient(135deg, #E53935, #c62828);
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 3px 12px rgba(229, 57, 53, 0.25);
          align-self: flex-start;
          font-family: inherit;
          height: 42px;
        }

        .btn-salvar-dados:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(229, 57, 53, 0.35);
        }

        .btn-salvar-dados:disabled {
          background: #9CA3AF;
          box-shadow: none;
          cursor: not-allowed;
          opacity: 0.7;
        }

        /* LOADING */
        .loading-spinner {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 50px 20px;
          gap: 14px;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(229, 57, 53, 0.1);
          border-top-color: #E53935;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .loading-spinner p {
          color: #6b7280;
          font-size: 13px;
          margin: 0;
        }

        /* ============================================ */
        /* RESPONSIVIDADE                               */
        /* ============================================ */

        @media (max-width: 1024px) {
          .form-grid-endereco {
            grid-template-columns: repeat(4, 1fr);
          }
          .endereco-campo-cep { grid-column: span 2; max-width: none; }
          .endereco-campo-uf { grid-column: span 1; }
          .endereco-campo-cidade { grid-column: span 3; }
          .endereco-campo-bairro { grid-column: span 2; }
          .endereco-campo-logradouro { grid-column: span 2; }
          .endereco-campo-numero { grid-column: span 1; }
          .endereco-campo-complemento { grid-column: span 2; }
        }

        @media (max-width: 768px) {
          .meus-dados-container {
            padding: 12px;
          }

          .meus-dados-header {
            padding: 14px 16px;
          }

          .meus-dados-header h2 {
            font-size: 18px;
          }

          .meus-dados-header p {
            font-size: 12px;
          }

          .meus-dados-form {
            padding: 16px;
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
          .endereco-campo-cep,
          .endereco-campo-uf,
          .endereco-campo-cidade,
          .endereco-campo-bairro,
          .endereco-campo-logradouro,
          .endereco-campo-numero,
          .endereco-campo-complemento {
            grid-column: span 1;
            max-width: none;
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
            height: 320px;
          }

          .search-box-container {
            max-width: 180px;
            height: 34px;
            top: 8px;
          }

          .search-box-input {
            font-size: 12px;
          }
        }

        @media (max-width: 480px) {
          .meus-dados-container {
            padding: 8px;
          }

          .meus-dados-header {
            padding: 12px 14px;
          }

          .meus-dados-header h2 {
            font-size: 16px;
          }

          .meus-dados-header p {
            font-size: 11px;
          }

          .meus-dados-form {
            padding: 12px;
          }

          .field-input {
            font-size: 13px;
            padding: 7px 10px;
            height: 36px;
          }

          .mapa-preview-container {
            height: 260px;
          }

          .search-box-container {
            max-width: 140px;
            height: 30px;
            top: 6px;
          }

          .search-box-input {
            font-size: 11px;
            padding: 0 8px;
          }

          .search-box-button {
            padding: 0 8px;
          }

          .aba-btn {
            font-size: 12px;
            padding: 7px 10px;
          }

          .aba-btn span {
            font-size: 14px;
          }

          .section-titulo {
            font-size: 12px;
          }

          .btn-salvar-dados {
            font-size: 13px;
            padding: 8px 20px;
            height: 38px;
          }

          .field-label {
            font-size: 11px;
          }
        }
      `}</style>
    </div>
  );
}