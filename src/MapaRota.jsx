// ============================================
// MAPAROTA.JSX - VERSÃO MELHORADA
// ============================================
import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, LayersControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';

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

const CORES_ENTREGA = [
  '#E53935', '#FB8C00', '#FDD835', '#43A047', 
  '#1E88E5', '#8E24AA', '#D81B60', '#00ACC1',
  '#6D4C41', '#546E7A'
];

// ============================================
// COMPONENTE: RoutingEngine (Single)
// ============================================
function RoutingEngine({ coordenadasColeta, coordenadasEntrega, onCalculado }) {
  const map = useMap();
  const routingRef = useRef(null);

  useEffect(() => {
    if (!map || !coordenadasColeta || !coordenadasEntrega) return;

    // Limpa rota anterior
    if (routingRef.current) {
      try {
        map.removeControl(routingRef.current);
      } catch (e) {}
      routingRef.current = null;
    }

    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(coordenadasColeta[0], coordenadasColeta[1]),
        L.latLng(coordenadasEntrega[0], coordenadasEntrega[1]),
      ],
      routeWhileDragging: false,
      show: false,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      lineOptions: {
        styles: [{ color: '#E53935', weight: 5, opacity: 0.8 }],
        extendToWaypoints: false,
        missingRouteTolerance: 0,
      },
      plan: L.Routing.plan(
        [
          L.latLng(coordenadasColeta[0], coordenadasColeta[1]),
          L.latLng(coordenadasEntrega[0], coordenadasEntrega[1]),
        ],
        { createMarker: () => false }
      ),
    });

    routingControl.on('routesfound', (e) => {
      const route = e.routes[0];
      if (!route) return;
      const distanciaKm = route.summary.totalDistance / 1000;
      onCalculado(distanciaKm);
    });

    routingControl.addTo(map);
    routingRef.current = routingControl;

    const bounds = L.latLngBounds([coordenadasColeta, coordenadasEntrega]);
    map.fitBounds(bounds, { padding: [50, 50] });

    return () => {
      if (routingRef.current) {
        try {
          map.removeControl(routingRef.current);
        } catch (e) {}
        routingRef.current = null;
      }
    };
  }, [map, coordenadasColeta, coordenadasEntrega, onCalculado]);

  return null;
}

// ============================================
// COMPONENTE: RoutingEngineMulti
// ============================================
function RoutingEngineMulti({ coordenadasColeta, coordenadasEntregas, onCalculado }) {
  const map = useMap();
  const routingRef = useRef(null);
  const polylinesRef = useRef([]);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!map || !coordenadasColeta || coordenadasEntregas.length === 0) return;

    // Limpa rotas anteriores
    if (routingRef.current) {
      try {
        map.removeControl(routingRef.current);
      } catch (e) {}
      routingRef.current = null;
    }
    
    polylinesRef.current.forEach(poly => {
      try {
        map.removeLayer(poly);
      } catch (e) {}
    });
    polylinesRef.current = [];

    markersRef.current.forEach(marker => {
      try {
        map.removeLayer(marker);
      } catch (e) {}
    });
    markersRef.current = [];

    const calcularRotaOtimizada = async () => {
      try {
        const coords = [
          [coordenadasColeta[1], coordenadasColeta[0]],
          ...coordenadasEntregas.map(c => [c[1], c[0]])
        ];

        const response = await fetch(
          `https://router.project-osrm.org/trip/v1/driving/${coords.map(c => c.join(',')).join(';')}?overview=full&geometries=geojson&steps=true&roundtrip=false`
        );

        if (!response.ok) throw new Error('Erro na API OSRM');

        const data = await response.json();

        if (data.code === 'Ok' && data.trips && data.trips.length > 0) {
          const trip = data.trips[0];
          const distanciaTotal = trip.distance / 1000;
          const tempoEstimado = Math.round(trip.duration / 60);
          const valorTotal = Math.round((10 + distanciaTotal * 2.5) * 100) / 100;

          const distanciasEntregas = [];
          if (trip.legs && trip.legs.length > 1) {
            for (let i = 1; i < trip.legs.length; i++) {
              distanciasEntregas.push(trip.legs[i].distance / 1000);
            }
          }

          if (distanciasEntregas.length === 0 && coordenadasEntregas.length > 0) {
            const distPorEntrega = distanciaTotal / coordenadasEntregas.length;
            for (let i = 0; i < coordenadasEntregas.length; i++) {
              distanciasEntregas.push(distPorEntrega);
            }
          }

          if (trip.geometry && trip.geometry.coordinates) {
            const latlngs = trip.geometry.coordinates.map(coord => [coord[1], coord[0]]);
            
            // Desenha rotas segmentadas
            coordenadasEntregas.forEach((coord, index) => {
              const cor = CORES_ENTREGA[index % CORES_ENTREGA.length];
              
              // Encontra o ponto mais próximo
              let minDist = Infinity;
              let closestIdx = 0;
              latlngs.forEach((p, i) => {
                const d = Math.sqrt(Math.pow(p[0] - coord[0], 2) + Math.pow(p[1] - coord[1], 2));
                if (d < minDist) {
                  minDist = d;
                  closestIdx = i;
                }
              });

              // Segmento da rota
              const startIdx = index === 0 ? 0 : Math.floor((index / coordenadasEntregas.length) * latlngs.length);
              const endIdx = index === coordenadasEntregas.length - 1 ? latlngs.length : Math.floor(((index + 1) / coordenadasEntregas.length) * latlngs.length);
              
              const segmentPoints = latlngs.slice(startIdx, endIdx);
              
              if (segmentPoints.length > 1) {
                const polyline = L.polyline(segmentPoints, {
                  color: cor,
                  weight: 4,
                  opacity: 0.7,
                });
                polyline.addTo(map);
                polylinesRef.current.push(polyline);
              }
            });

            // Marcadores das entregas
            coordenadasEntregas.forEach((coord, index) => {
              const ordem = index + 1;
              const cor = CORES_ENTREGA[index % CORES_ENTREGA.length];
              const icon = L.divIcon({
                html: `<div style="background: ${cor}; color: #fff; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; border: 3px solid #fff; box-shadow: 0 2px 10px rgba(0,0,0,0.3);">${ordem}</div>`,
                className: '',
                iconSize: [32, 32],
                iconAnchor: [16, 16]
              });
              
              const marker = L.marker([coord[0], coord[1]], { icon });
              marker.addTo(map);
              markersRef.current.push(marker);
            });

            // Ajusta o zoom
            const bounds = L.latLngBounds(latlngs);
            map.fitBounds(bounds, { padding: [60, 60] });
          }

          onCalculado({
            distanciaTotal,
            tempoEstimado,
            valorTotal,
            entregas: distanciasEntregas.map(d => ({ distanciaKm: d }))
          });
        } else {
          usarRotaSimples();
        }
      } catch (error) {
        console.error('Erro ao calcular rota otimizada:', error);
        usarRotaSimples();
      }
    };

    const usarRotaSimples = () => {
      const waypoints = [
        L.latLng(coordenadasColeta[0], coordenadasColeta[1]),
        ...coordenadasEntregas.map(coord => L.latLng(coord[0], coord[1]))
      ];

      const routingControl = L.Routing.control({
        waypoints: waypoints,
        routeWhileDragging: false,
        show: false,
        addWaypoints: false,
        draggableWaypoints: false,
        fitSelectedRoutes: true,
        lineOptions: {
          styles: [{ color: '#E53935', weight: 4 }],
          extendToWaypoints: false,
          missingRouteTolerance: 0,
        },
        plan: L.Routing.plan(waypoints, { createMarker: () => false }),
      });

      routingControl.on('routesfound', (e) => {
        const route = e.routes[0];
        if (!route) return;
        
        const distanciaTotal = route.summary.totalDistance / 1000;
        const tempoEstimado = Math.round(route.summary.totalTime / 60);
        const distPorEntrega = distanciaTotal / coordenadasEntregas.length;
        const valorTotal = Math.round((10 + distanciaTotal * 2.5) * 100) / 100;
        
        const distanciasEntregas = [];
        for (let i = 0; i < coordenadasEntregas.length; i++) {
          distanciasEntregas.push(distPorEntrega);
        }

        coordenadasEntregas.forEach((coord, index) => {
          const ordem = index + 1;
          const cor = CORES_ENTREGA[index % CORES_ENTREGA.length];
          const icon = L.divIcon({
            html: `<div style="background: ${cor}; color: #fff; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; border: 2px solid #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">${ordem}</div>`,
            className: '',
            iconSize: [28, 28],
            iconAnchor: [14, 14]
          });
          
          const marker = L.marker([coord[0], coord[1]], { icon });
          marker.addTo(map);
          markersRef.current.push(marker);
        });

        onCalculado({
          distanciaTotal,
          tempoEstimado,
          valorTotal,
          entregas: distanciasEntregas.map(d => ({ distanciaKm: d }))
        });
      });

      routingControl.addTo(map);
      routingRef.current = routingControl;

      const bounds = L.latLngBounds(waypoints);
      map.fitBounds(bounds, { padding: [50, 50] });
    };

    calcularRotaOtimizada();

    return () => {
      if (routingRef.current) {
        try {
          map.removeControl(routingRef.current);
        } catch (e) {}
        routingRef.current = null;
      }
      polylinesRef.current.forEach(poly => {
        try {
          map.removeLayer(poly);
        } catch (e) {}
      });
      polylinesRef.current = [];
      markersRef.current.forEach(marker => {
        try {
          map.removeLayer(marker);
        } catch (e) {}
      });
      markersRef.current = [];
    };
  }, [map, coordenadasColeta, coordenadasEntregas, onCalculado]);

  return null;
}

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
// COMPONENTE: MapaRota
// ============================================
export default function MapaRota({ 
  enderecoColeta, 
  enderecoEntrega, 
  onValorCalculado,
  entregas = []
}) {
  const [coordenadasColeta, setCoordenadasColeta] = useState(null);
  const [coordenadasEntrega, setCoordenadasEntrega] = useState(null);
  const [coordenadasEntregas, setCoordenadasEntregas] = useState([]);
  const [distancia, setDistancia] = useState(0);
  const [distanciaTotal, setDistanciaTotal] = useState(0);
  const [valor, setValor] = useState(10);
  const [valorTotal, setValorTotal] = useState(10);
  const [tempoEstimado, setTempoEstimado] = useState(0);
  const [carregando, setCarregando] = useState(false);
  const [modoMultiplo, setModoMultiplo] = useState(false);
  const [erroGeocoding, setErroGeocoding] = useState(false);

  const buscarCoordenadas = async (endereco) => {
    if (!endereco || endereco.trim().length < 3) return null;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(endereco)}&limit=1&countrycodes=BR&accept-language=pt-BR`,
        { headers: { 'User-Agent': 'JaVaiApp/1.0' } }
      );
      const data = await response.json();
      if (data && data.length > 0) {
        return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      }
      return null;
    } catch (error) {
      console.error('Erro no geocoding:', error);
      return null;
    }
  };

  useEffect(() => {
    const entregasValidas = entregas.filter(e => e.enderecoEntrega && e.enderecoEntrega.trim().length > 0);
    setModoMultiplo(entregasValidas.length > 1);
  }, [entregas]);

  useEffect(() => {
    let ativo = true;

    const carregarCoordenadas = async () => {
      if (!enderecoColeta) {
        setCoordenadasColeta(null);
        setCoordenadasEntrega(null);
        setCoordenadasEntregas([]);
        setErroGeocoding(false);
        return;
      }

      setCarregando(true);
      setErroGeocoding(false);

      const coordColeta = await buscarCoordenadas(enderecoColeta);

      if (entregas && entregas.length > 0) {
        const entregasValidas = entregas.filter(e => e.enderecoEntrega && e.enderecoEntrega.trim().length > 0);
        
        if (entregasValidas.length > 0) {
          const coordsEntregas = await Promise.all(
            entregasValidas.map(e => buscarCoordenadas(e.enderecoEntrega))
          );
          
          const coordsFiltradas = coordsEntregas.filter(c => c !== null);
          
          if (ativo) {
            setCoordenadasColeta(coordColeta);
            setCoordenadasEntregas(coordsFiltradas);
            setCoordenadasEntrega(coordsFiltradas.length > 0 ? coordsFiltradas[0] : null);
            setErroGeocoding(coordsFiltradas.length === 0);
            setCarregando(false);
          }
          return;
        }
      }

      if (enderecoEntrega) {
        const coordEntrega = await buscarCoordenadas(enderecoEntrega);
        if (ativo) {
          setCoordenadasColeta(coordColeta);
          setCoordenadasEntrega(coordEntrega);
          setCoordenadasEntregas(coordEntrega ? [coordEntrega] : []);
          setErroGeocoding(!coordColeta || !coordEntrega);
          setCarregando(false);
        }
      } else {
        if (ativo) {
          setCoordenadasColeta(coordColeta);
          setCoordenadasEntrega(null);
          setCoordenadasEntregas([]);
          setErroGeocoding(!coordColeta);
          setCarregando(false);
        }
      }
    };

    const timer = setTimeout(carregarCoordenadas, 500);
    return () => {
      ativo = false;
      clearTimeout(timer);
    };
  }, [enderecoColeta, enderecoEntrega, entregas]);

  const handleRotaCalculada = (distanciaKm) => {
    setDistancia(distanciaKm);
    setDistanciaTotal(distanciaKm);
    const valorFinal = Math.round((10 + distanciaKm * 2.5) * 100) / 100;
    setValor(valorFinal);
    setValorTotal(valorFinal);
    if (onValorCalculado) {
      onValorCalculado(valorFinal, distanciaKm);
    }
  };

  const handleRotaMultiCalculada = (dados) => {
    setDistanciaTotal(dados.distanciaTotal || 0);
    setValorTotal(dados.valorTotal || 10);
    setTempoEstimado(dados.tempoEstimado || 0);
    setDistancia(dados.distanciaTotal || 0);
    setValor(dados.valorTotal || 10);

    if (onValorCalculado) {
      onValorCalculado(dados.valorTotal, dados.distanciaTotal);
    }

    if (dados.entregas && entregas.length > 0) {
      entregas.forEach((entrega, index) => {
        if (dados.entregas[index]) {
          entrega.distanciaKm = dados.entregas[index].distanciaKm || 0;
        }
      });
    }
  };

  const entregasValidas = entregas.filter(e => e.enderecoEntrega && e.enderecoEntrega.trim().length > 0);

  if (!enderecoColeta) {
    return (
      <div className="mapa-placeholder">
        <p>📍 Preencha o endereço de coleta para visualizar a rota</p>
      </div>
    );
  }

  if (entregasValidas.length === 0 && !enderecoEntrega) {
    return (
      <div className="mapa-placeholder">
        <p>🏠 Adicione pelo menos uma entrega para traçar a rota</p>
      </div>
    );
  }

  if (erroGeocoding) {
    return (
      <div className="mapa-placeholder error">
        <p>⚠️ Não foi possível localizar o endereço. Verifique se está correto.</p>
      </div>
    );
  }

  if (carregando) {
    return (
      <div className="mapa-placeholder loading">
        <div className="mapa-loading-spinner"></div>
        <p>Localizando endereços...</p>
      </div>
    );
  }

  return (
    <div className="mapa-wrapper">
      <div className="mapa-container">
        <MapContainer
          center={coordenadasColeta || [-22.0089, -47.8906]}
          zoom={13}
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
            <BaseLayer name="Claro">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            </BaseLayer>
          </LayersControl>

          {coordenadasColeta && (
            <Marker position={coordenadasColeta}>
              <Popup>
                <strong>📍 Coleta</strong><br />
                {enderecoColeta}
              </Popup>
            </Marker>
          )}

          {coordenadasEntregas.length > 0 && (
            <>
              {coordenadasEntregas.map((coord, index) => {
                const entrega = entregasValidas[index];
                if (!coord || !entrega) return null;
                
                const cor = CORES_ENTREGA[index % CORES_ENTREGA.length];
                const ordem = index + 1;
                
                return (
                  <Marker 
                    key={index} 
                    position={coord}
                    icon={L.divIcon({
                      html: `<div style="background: ${cor}; color: #fff; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; border: 3px solid #fff; box-shadow: 0 2px 10px rgba(0,0,0,0.3);">${ordem}</div>`,
                      className: '',
                      iconSize: [32, 32],
                      iconAnchor: [16, 16]
                    })}
                  >
                    <Popup>
                      <strong>🏠 Entrega #{ordem}</strong><br />
                      <strong>Cliente:</strong> {entrega.cliente || 'Não informado'}<br />
                      <strong>Endereço:</strong> {entrega.enderecoEntrega}<br />
                      {entrega.numeroPedido && <><strong>Pedido:</strong> {entrega.numeroPedido}<br /></>}
                      {entrega.descricao && <><strong>Descrição:</strong> {entrega.descricao}</>}
                      {entrega.distanciaKm > 0 && (
                        <><br /><strong>Distância:</strong> {entrega.distanciaKm.toFixed(1)} km</>
                      )}
                    </Popup>
                  </Marker>
                );
              })}
            </>
          )}

          {modoMultiplo && coordenadasColeta && coordenadasEntregas.length > 0 && (
            <RoutingEngineMulti
              coordenadasColeta={coordenadasColeta}
              coordenadasEntregas={coordenadasEntregas}
              onCalculado={handleRotaMultiCalculada}
            />
          )}

          {!modoMultiplo && coordenadasColeta && coordenadasEntrega && (
            <RoutingEngine
              coordenadasColeta={coordenadasColeta}
              coordenadasEntrega={coordenadasEntrega}
              onCalculado={handleRotaCalculada}
            />
          )}
        </MapContainer>
      </div>

      {distanciaTotal > 0 && (
        <div className="mapa-resumo">
          <div className="mapa-resumo-left">
            <span className="mapa-resumo-distancia">
              📏 <strong>{distanciaTotal.toFixed(1)} km</strong> total
            </span>
            {modoMultiplo && entregasValidas.length > 0 && (
              <span className="mapa-resumo-entregas">
                • {entregasValidas.length} entregas
              </span>
            )}
            {tempoEstimado > 0 && (
              <span className="mapa-resumo-tempo">
                • ⏱️ ~{tempoEstimado} min
              </span>
            )}
          </div>
          <div className="mapa-resumo-right">
            <span className="mapa-resumo-valor">
              R$ {valorTotal.toFixed(2)}
            </span>
          </div>
          <div className="mapa-detalhe">
            Taxa mínima R$ 10,00 + {distanciaTotal.toFixed(1)} km × R$ 2,50
            {modoMultiplo && ` • ${entregasValidas.length} entregas`}
          </div>
        </div>
      )}

      <style>{`
        .mapa-wrapper {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .mapa-container {
          height: 100%;
          width: 100%;
          border-radius: 12px;
          overflow: hidden;
          background: #f0ebe6;
        }

        .leaflet-container {
          height: 100% !important;
          width: 100% !important;
        }

        .mapa-placeholder {
          height: 100%;
          width: 100%;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(10px);
          border: 2px dashed rgba(229, 57, 53, 0.15);
          min-height: 200px;
          gap: 12px;
        }

        .mapa-placeholder p {
          padding: 20px;
          text-align: center;
          color: #9E9E9E;
          font-size: 15px;
          margin: 0;
        }

        .mapa-placeholder.error p {
          color: #E53935;
        }

        .mapa-placeholder.loading p {
          color: #757575;
        }

        .mapa-loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(229, 57, 53, 0.1);
          border-top-color: #E53935;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .mapa-resumo {
          margin-top: 10px;
          padding: 12px 18px;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
          gap: 6px;
          color: #424242;
        }

        .mapa-resumo-left {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .mapa-resumo-right {
          display: flex;
          align-items: center;
        }

        .mapa-resumo-distancia {
          font-size: 14px;
        }

        .mapa-resumo-entregas, .mapa-resumo-tempo {
          font-size: 13px;
          color: #757575;
        }

        .mapa-resumo-valor {
          font-size: 20px;
          font-weight: 700;
          color: #E53935;
        }

        .mapa-detalhe {
          font-size: 11px;
          color: #9E9E9E;
          width: 100%;
          margin-top: 2px;
        }

        .leaflet-div-icon {
          background: transparent !important;
          border: none !important;
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

        .leaflet-routing-container {
          display: none !important;
        }

        @media (max-width: 480px) {
          .mapa-container {
            height: 100%;
            min-height: 200px;
          }

          .mapa-resumo {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
            padding: 10px 14px;
          }

          .mapa-resumo-left {
            width: 100%;
            justify-content: flex-start;
          }

          .mapa-resumo-right {
            width: 100%;
            justify-content: flex-start;
          }

          .mapa-resumo-valor {
            font-size: 18px;
          }

          .mapa-placeholder {
            min-height: 150px;
          }

          .mapa-placeholder p {
            font-size: 13px;
            padding: 12px;
          }
        }
      `}</style>
    </div>
  );
}