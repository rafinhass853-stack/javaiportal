// ============================================
// MEUSDADOS.JSX - VERSÃO COM GOOGLE MAPS IDÊNTICO
// ============================================
import { useCallback, useEffect, useRef, useState } from 'react';
import { db } from './firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

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
// COMPONENTE: GoogleMap (usando Web Components com estilo Google Maps)
// ============================================
function GoogleMapComponent({ 
  center, 
  zoom, 
  markerPosition, 
  onMarkerDragEnd,
  onPlaceSelect,
  nomeEstabelecimento,
  endereco 
}) {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const placePickerRef = useRef(null);
  const infoWindowRef = useRef(null);

  // Inicializar o mapa quando o componente montar
  useEffect(() => {
    // Verificar se o script do Google Maps já foi carregado
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,marker&v=weekly`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
      
      script.onload = () => {
        // Carregar os Web Components
        const componentScript = document.createElement('script');
        componentScript.src = 'https://ajax.googleapis.com/ajax/libs/@googlemaps/extended-component-library/0.6.11/index.min.js';
        componentScript.type = 'module';
        document.head.appendChild(componentScript);
      };
    }

    // Inicializar InfoWindow
    if (window.google) {
      infoWindowRef.current = new google.maps.InfoWindow();
    }
  }, []);

  // Atualizar mapa quando center ou zoom mudarem
  useEffect(() => {
    if (mapRef.current && mapRef.current.innerMap) {
      const map = mapRef.current.innerMap;
      if (center) {
        map.panTo({ lat: center[0], lng: center[1] });
      }
      if (zoom) {
        map.setZoom(zoom);
      }
    }
  }, [center, zoom]);

  // Atualizar marcador quando markerPosition mudar
  useEffect(() => {
    if (markerRef.current && markerPosition) {
      markerRef.current.position = { lat: markerPosition[0], lng: markerPosition[1] };
    }
  }, [markerPosition]);

  // Quando o mapa carregar, configurar os estilos
  const handleMapLoad = useCallback((mapElement) => {
    const map = mapElement.innerMap;
    
    // Configurar estilo igual ao Google Maps
    map.setOptions({
      mapTypeControl: true,
      mapTypeControlOptions: {
        style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
        position: google.maps.ControlPosition.TOP_RIGHT,
      },
      streetViewControl: true,
      streetViewControlOptions: {
        position: google.maps.ControlPosition.RIGHT_BOTTOM,
      },
      fullscreenControl: true,
      fullscreenControlOptions: {
        position: google.maps.ControlPosition.RIGHT_BOTTOM,
      },
      zoomControl: true,
      zoomControlOptions: {
        position: google.maps.ControlPosition.RIGHT_CENTER,
      },
      // Mapa híbrido como padrão
      mapTypeId: google.maps.MapTypeId.HYBRID,
    });

    mapRef.current = mapElement;
  }, []);

  // Handler para quando um lugar é selecionado
  const handlePlaceChange = useCallback((event) => {
    const place = event.detail;

    if (!place || !place.location) {
      return;
    }

    if (place.viewport) {
      mapRef.current.innerMap.fitBounds(place.viewport);
    } else {
      mapRef.current.innerMap.panTo(place.location);
      mapRef.current.innerMap.setZoom(17);
    }

    if (markerRef.current) {
      markerRef.current.position = place.location;
    }

    // Atualizar InfoWindow
    if (infoWindowRef.current && markerRef.current) {
      infoWindowRef.current.setContent(`
        <div style="padding: 4px 0;">
          <strong style="font-size: 14px;">${place.displayName || nomeEstabelecimento || 'Local selecionado'}</strong><br>
          <span style="font-size: 12px; color: #5f6368;">${place.formattedAddress || endereco || ''}</span>
        </div>
      `);
      infoWindowRef.current.open(mapRef.current.innerMap, markerRef.current);
    }

    if (onPlaceSelect) {
      onPlaceSelect({
        lat: place.location.lat,
        lng: place.location.lng,
        formattedAddress: place.formattedAddress,
        displayName: place.displayName,
      });
    }
  }, [onPlaceSelect, nomeEstabelecimento, endereco]);

  // Handler para arrastar marcador
  const handleMarkerDragEnd = useCallback((event) => {
    const position = event.target.position;
    if (onMarkerDragEnd) {
      onMarkerDragEnd([position.lat, position.lng]);
    }

    // Atualizar InfoWindow
    if (infoWindowRef.current && markerRef.current) {
      infoWindowRef.current.setContent(`
        <div style="padding: 4px 0;">
          <strong style="font-size: 14px;">📍 ${nomeEstabelecimento || 'Posição ajustada'}</strong><br>
          <span style="font-size: 12px; color: #5f6368;">Arraste para ajustar a localização</span>
        </div>
      `);
      infoWindowRef.current.open(mapRef.current.innerMap, markerRef.current);
    }
  }, [onMarkerDragEnd, nomeEstabelecimento]);

  return (
    <div className="mapa-wrapper">
      <gmp-map
        ref={handleMapLoad}
        center={center ? { lat: center[0], lng: center[1] } : { lat: -14.235, lng: -51.925 }}
        zoom={zoom || 4}
        map-id="DEMO_MAP_ID"
        style={{ height: '100%', width: '100%' }}
      >
        {/* Place Picker - Barra de pesquisa igual Google Maps */}
        <div slot="control-block-start-inline-start" className="place-picker-container">
          <gmpx-place-picker
            ref={placePickerRef}
            placeholder="Pesquisar no mapa"
            ongmpx-placechange={handlePlaceChange}
          />
        </div>

        {/* Marcador estilo Google Maps */}
        <gmp-advanced-marker
          ref={markerRef}
          position={markerPosition ? { lat: markerPosition[0], lng: markerPosition[1] } : null}
          draggable
          ondragend={handleMarkerDragEnd}
        />
      </gmp-map>

      {/* Scripts do Google Maps */}
      <gmpx-api-loader
        key={GOOGLE_MAPS_API_KEY}
        solution-channel="GMP_GE_mapsandplacesautocomplete_v2"
      />
    </div>
  );
}

// ============================================
// COMPONENTE PRINCIPAL: MeusDados
// ============================================
export default function MeusDados({ estabelecimentoId, onDadosSalvos }) {
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [mensagemTipo, setMensagemTipo] = useState('sucesso');
  const [mensagemErro, setMensagemErro] = useState('');

  // Estados do Formulário
  const [nomeEstabelecimento, setNomeEstabelecimento] = useState('');
  const [telefone, setTelefone] = useState('');
  const [uf, setUf] = useState('');
  const [cidade, setCidade] = useState('');
  const [cidadesFiltradas, setCidadesFiltradas] = useState([]);
  const [mostrarSugestoesCidade, setMostrarSugestoesCidade] = useState(false);
  const [bairro, setBairro] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [sugestoesLogradouro, setSugestoesLogradouro] = useState([]);
  const [mostrarSugestoesLogradouro, setMostrarSugestoesLogradouro] = useState(false);
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [cep, setCep] = useState('');

  // Estados do Mapa
  const [coordenadasSalvas, setCoordenadasSalvas] = useState(null);
  const [coordenadasAtuais, setCoordenadasAtuais] = useState(null);
  const [zoomMapa, setZoomMapa] = useState(4);
  const [centroMapa, setCentroMapa] = useState([-14.235, -51.925]);
  const [buscandoCoordenadas, setBuscandoCoordenadas] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);

  const cidadeInputRef = useRef(null);
  const cidadeResultsRef = useRef(null);
  const timeoutRef = useRef(null);
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
  // BUSCAR COORDENADAS COM GEOCODE (Google Maps)
  // ============================================
  const geocodeEndereco = useCallback((endereco) => {
    return new Promise((resolve, reject) => {
      if (!window.google) {
        reject(new Error('Google Maps não carregado'));
        return;
      }

      const geocoder = new google.maps.Geocoder();
      geocoder.geocode(
        {
          address: endereco,
          region: 'br',
          language: 'pt-BR',
        },
        (results, status) => {
          if (status === 'OK' && results && results.length > 0) {
            const location = results[0].geometry.location;
            resolve({
              lat: location.lat(),
              lng: location.lng(),
              formattedAddress: results[0].formatted_address,
            });
          } else {
            reject(new Error(`Geocodificação falhou: ${status}`));
          }
        }
      );
    });
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
        } else if (data.uf) {
          try {
            const coords = await geocodeEndereco(`${data.uf}, Brasil`);
            if (coords) {
              setCentroMapa([coords.lat, coords.lng]);
              setZoomMapa(7);
            }
          } catch (error) {
            console.error('Erro ao buscar UF:', error);
          }
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
      geocodeEndereco(`${uf}, Brasil`)
        .then(coords => {
          if (coords) {
            setCentroMapa([coords.lat, coords.lng]);
            setZoomMapa(7);
            if (!coordenadasSalvas) {
              setCoordenadasAtuais(null);
            }
          }
        })
        .catch(() => {});
    } else {
      setCidadesFiltradas([]);
      setCidade('');
      if (!coordenadasSalvas) {
        setCentroMapa([-14.235, -51.925]);
        setZoomMapa(4);
        setCoordenadasAtuais(null);
      }
    }
  }, [uf, buscarCidadesPorUF, coordenadasSalvas, geocodeEndereco]);

  // ============================================
  // EFFECT: Buscar coordenadas quando cidade mudar
  // ============================================
  useEffect(() => {
    if (cidade && uf && uf.length === 2 && !coordenadasSalvas) {
      geocodeEndereco(`${cidade}, ${uf}, Brasil`)
        .then(coords => {
          if (coords) {
            setCentroMapa([coords.lat, coords.lng]);
            setZoomMapa(13);
            setCoordenadasAtuais(null);
          }
        })
        .catch(() => {});
    }
  }, [cidade, uf, coordenadasSalvas, geocodeEndereco]);

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
    if (!coordenadasSalvas) {
      setCoordenadasAtuais(null);
    }
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
  // HANDLER: Lugar selecionado no Place Picker
  // ============================================
  const handlePlaceSelect = (place) => {
    const coords = [place.lat, place.lng];
    setCoordenadasAtuais(coords);
    setZoomMapa(17);
    setCentroMapa(coords);
    
    // Tentar extrair os dados do endereço
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
    // Validações
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
      } else {
        try {
          const coords = await geocodeEndereco(enderecoCompletoFormatado);
          if (coords) {
            lat = coords.lat;
            lon = coords.lng;
            const novaCoord = [lat, lon];
            setCoordenadasAtuais(novaCoord);
            setZoomMapa(17);
            setCentroMapa([lat, lon]);
          }
        } catch (error) {
          console.error('Erro ao geocodificar:', error);
        }
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
      <GoogleMapComponent
        center={posicaoFinal || centroMapa}
        zoom={posicaoFinal ? 17 : zoomMapa}
        markerPosition={posicaoFinal}
        onMarkerDragEnd={handleMarkerPositionChange}
        onPlaceSelect={handlePlaceSelect}
        nomeEstabelecimento={nomeEstabelecimento}
        endereco={`${logradouro}, ${numero} - ${cidade}`}
      />
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
        <p>Configure os dados do seu estabelecimento. Pesquise diretamente no mapa ou preencha o formulário.</p>
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

        {/* Endereço */}
        <div className="form-section">
          <div className="section-titulo">📍 Endereço de Coleta</div>
          
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
                <span className="field-hint">(Essencial para precisão)</span>
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

        {/* MAPA */}
        <div className="form-section mapa-section">
          <div className="section-titulo">🗺️ Localização no Mapa</div>
          <div className="mapa-preview-container">
            {renderMapa()}
          </div>
          <p className="mapa-hint">
            🔍 <strong>Pesquise no mapa</strong> ou preencha o formulário acima.
            <strong> Arraste o marcador </strong> para ajustar a localização exata.
          </p>
        </div>

        {/* Ações */}
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

        .form-grid-cep {
          display: grid;
          gap: 12px 16px;
          grid-template-columns: 1fr;
          margin-bottom: 16px;
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

        .endereco-campo-cep { 
          grid-column: span 1;
          max-width: 300px;
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
          margin-bottom: 4px;
          font-size: 13px;
          color: #424242;
        }

        .field-required {
          color: #E53935;
          font-weight: 700;
        }

        .field-hint {
          font-weight: 400;
          font-size: 11px;
          color: #9E9E9E;
          margin-left: 6px;
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

        .field-input:disabled {
          background: #f5f5f5;
          color: #9E9E9E;
          cursor: not-allowed;
        }

        .field-input select {
          appearance: none;
        }

        .cep-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .cep-input-wrapper .field-input {
          padding-right: 40px;
        }

        .cep-loading {
          position: absolute;
          right: 12px;
          animation: spin 1s linear infinite;
          color: #E53935;
          font-size: 16px;
        }

        .cep-hint {
          font-size: 12px;
          color: #9E9E9E;
          margin: 4px 0 0 0;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Autocomplete */
        .autocomplete-wrapper {
          position: relative;
          width: 100%;
        }

        .autocomplete-results {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          right: 0;
          max-height: 200px;
          overflow-y: auto;
          background: #FFFFFF;
          border-radius: 10px;
          border: 1px solid rgba(229, 57, 53, 0.15);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
          z-index: 1000;
          padding: 4px 0;
        }

        .autocomplete-item {
          padding: 10px 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          border-bottom: 1px solid rgba(0, 0, 0, 0.04);
        }

        .autocomplete-item:last-child {
          border-bottom: none;
        }

        .autocomplete-item:hover {
          background: rgba(229, 57, 53, 0.05);
        }

        .autocomplete-item-main {
          font-weight: 500;
          color: #212121;
          font-size: 14px;
        }

        .autocomplete-item-detail {
          font-size: 12px;
          color: #757575;
          margin-top: 2px;
        }

        .autocomplete-results::-webkit-scrollbar {
          width: 6px;
        }
        .autocomplete-results::-webkit-scrollbar-track {
          background: transparent;
        }
        .autocomplete-results::-webkit-scrollbar-thumb {
          background: #BDBDBD;
          border-radius: 3px;
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
          height: 450px;
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

        /* Place Picker - Pesquisa no mapa estilo Google */
        .place-picker-container {
          padding: 10px;
          width: 280px;
          max-width: 90%;
        }

        .place-picker-container gmpx-place-picker {
          width: 100%;
          --gmpx-color-surface: white;
          --gmpx-color-on-surface: #202124;
          --gmpx-color-on-surface-variant: #5f6368;
          --gmpx-color-primary: #1a73e8;
          --gmpx-color-outline: #dadce0;
          --gmpx-border-radius: 24px;
          --gmpx-font-family: 'Roboto', Arial, sans-serif;
        }

        /* Estilos do Google Maps Web Components */
        gmp-map {
          height: 100% !important;
          width: 100% !important;
        }

        /* Info do Mapa */
        .mapa-preview-info {
          position: absolute;
          bottom: 12px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.75);
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
          pointer-events: none;
          flex-wrap: wrap;
          justify-content: center;
          max-width: 90%;
        }

        .mapa-preview-coords {
          color: #FBC02D;
          font-weight: 500;
        }

        .mapa-preview-hint {
          color: #81D4FA;
          font-weight: 400;
        }

        .mapa-hint {
          margin-top: 10px;
          font-size: 13px;
          color: #9E9E9E;
          text-align: center;
        }

        .mapa-hint strong {
          color: #E53935;
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

        .mensagem-info {
          background: rgba(33, 150, 243, 0.08);
          border-left: 4px solid #2196F3;
          color: #0D47A1;
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

          .place-picker-container {
            width: 200px;
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

          .place-picker-container {
            width: 150px;
          }
        }
      `}</style>
    </div>
  );
}
