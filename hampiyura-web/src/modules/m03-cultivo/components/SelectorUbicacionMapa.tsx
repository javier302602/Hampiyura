import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { CENTRO_PERU_AMAZONICO, agregarTileLayer, iconoPinNuevo } from '../leaflet-setup';
import { buscarLocalidad, type SugerenciaLocalidad } from '../api/geocoding.api';
import { listarMapaCultivo } from '../api/mapa-cultivo.api';
import { LocateFixed } from 'lucide-react';
import Button from '../../../shared/ui/Button';

interface Props {
  // Para mostrar pines de referencia de ubicaciones YA registradas de la misma planta -- ayuda a
  // no registrar dos veces la misma ubicación. Si no se pasa, el selector funciona igual pero sin
  // esos pines (y sin cargar el plugin de clustering, que no hace falta con un único pin nuevo).
  plantaId?: string;
  // Muestra el botón "Usar mi ubicación actual" (GPS del navegador). El permiso lo pide el propio navegador
  // SOLO al hacer clic en el botón -- nunca se consulta la ubicación por sí solo.
  permitirGps?: boolean;
  onCambiarUbicacion: (lat: number, lon: number) => void;
}

const DEBOUNCE_MS = 350;
const ZOOM_AL_BUSCAR = 13;
const ZOOM_AL_HACER_CLICK = 14;

// Reutiliza la base de Leaflet de M-03 (leaflet-setup.ts) -- mismo tile layer, mismo fix de ícono,
// mismo retinte de tema oscuro (global, en styles.css) que MapaCultivoPage. No es una reimplementación
// del mapa: es la segunda pantalla que usa la misma base compartida.
function SelectorUbicacionMapa({ plantaId, permitirGps, onCambiarUbicacion }: Props) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const mapaRef = useRef<L.Map | null>(null);
  const marcadorNuevoRef = useRef<L.Marker | null>(null);
  const clusterReferenciaRef = useRef<L.MarkerClusterGroup | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  // El mapa se inicializa una sola vez (efecto con deps []), así que su manejador de clic captura
  // esta función para siempre -- pasarla por ref evita que quede "congelada" con la versión de
  // onCambiarUbicacion del primer render si el padre pasara una función nueva en cada render.
  const onCambiarUbicacionRef = useRef(onCambiarUbicacion);
  onCambiarUbicacionRef.current = onCambiarUbicacion;

  const [busqueda, setBusqueda] = useState('');
  const [sugerencias, setSugerencias] = useState<SugerenciaLocalidad[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState<string | null>(null);
  const [pinNuevo, setPinNuevo] = useState<{ lat: number; lon: number } | null>(null);
  const [obteniendoGps, setObteniendoGps] = useState(false);
  const [avisoGps, setAvisoGps] = useState<string | null>(null);

  function colocarPinNuevo(lat: number, lon: number) {
    const mapa = mapaRef.current;
    if (!mapa) return;
    if (!marcadorNuevoRef.current) {
      marcadorNuevoRef.current = L.marker([lat, lon], { icon: iconoPinNuevo(), draggable: true })
        .addTo(mapa)
        .on('dragend', (e) => {
          const { lat: la, lng: lo } = (e.target as L.Marker).getLatLng();
          setPinNuevo({ lat: la, lon: lo });
          onCambiarUbicacionRef.current(la, lo);
        });
    } else {
      marcadorNuevoRef.current.setLatLng([lat, lon]);
    }
    setPinNuevo({ lat, lon });
    onCambiarUbicacionRef.current(lat, lon);
  }

  // Inicializa el mapa una sola vez -- clic para soltar/mover el pin nuevo.
  useEffect(() => {
    if (!contenedorRef.current || mapaRef.current) return;
    const mapa = L.map(contenedorRef.current).setView(CENTRO_PERU_AMAZONICO, 5);
    agregarTileLayer(mapa);
    mapa.on('click', (e: L.LeafletMouseEvent) => {
      mapa.setView(e.latlng, Math.max(mapa.getZoom(), ZOOM_AL_HACER_CLICK));
      colocarPinNuevo(e.latlng.lat, e.latlng.lng);
    });
    mapaRef.current = mapa;
    return () => { mapa.remove(); mapaRef.current = null; marcadorNuevoRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo se monta una vez; colocarPinNuevo usa refs, no estado capturado
  }, []);

  // Pines de referencia: otras ubicaciones ya registradas de la MISMA planta (si se pasó
  // plantaId), para evitar registrar la misma ubicación dos veces. Reusa el endpoint público de
  // M-03 (ya respeta RN-07: una planta en riesgo no expone coordenadas exactas ni aquí).
  useEffect(() => {
    if (!plantaId) return;
    const mapa = mapaRef.current;
    if (!mapa) return;
    let cancelado = false;
    listarMapaCultivo().then((ubicaciones) => {
      if (cancelado) return;
      const cluster = L.markerClusterGroup();
      const propias = ubicaciones.filter((u) => u.plantaId === plantaId && u.latitud !== null && u.longitud !== null);
      for (const u of propias) {
        cluster.addLayer(
          L.marker([u.latitud as number, u.longitud as number]).bindPopup(`Ya registrada: ${u.zona}`),
        );
      }
      cluster.addTo(mapa);
      clusterReferenciaRef.current = cluster;
    }).catch(() => { /* pines de referencia son una ayuda opcional -- si fallan, el selector sigue funcionando */ });
    return () => { cancelado = true; clusterReferenciaRef.current?.remove(); clusterReferenciaRef.current = null; };
  }, [plantaId]);

  // Búsqueda de localidad con debounce (RF nuevo, M-03): evita disparar una solicitud a Nominatim
  // por cada tecla -- la política de uso de la instancia pública es de ~1 req/seg (ver geocoding.api.ts).
  // `suprimirProximaBusquedaRef`: al elegir una sugerencia, el input se rellena con su nombre
  // completo (para que quede visible qué se eligió) -- sin esto, ese cambio de texto dispara una
  // NUEVA búsqueda (con el nombre completo como query) y el dropdown de sugerencias reaparece solo.
  const suprimirProximaBusquedaRef = useRef(false);
  useEffect(() => {
    if (suprimirProximaBusquedaRef.current) { suprimirProximaBusquedaRef.current = false; return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    abortRef.current?.abort();
    const texto = busqueda.trim();
    if (texto.length < 3) { setSugerencias([]); setErrorBusqueda(null); return; }
    debounceRef.current = setTimeout(() => {
      const controller = new AbortController();
      abortRef.current = controller;
      setBuscando(true);
      setErrorBusqueda(null);
      buscarLocalidad(texto, controller.signal)
        .then(setSugerencias)
        .catch((err) => { if (err?.name !== 'AbortError') setErrorBusqueda('No se pudo buscar la localidad.'); })
        .finally(() => setBuscando(false));
    }, DEBOUNCE_MS);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [busqueda]);

  // GPS del dispositivo: el navegador muestra su propio diálogo de permiso. Requiere contexto seguro
  // (HTTPS o localhost) -- en un servidor sin HTTPS el navegador lo bloquea y se cae al modo manual.
  function usarUbicacionActual() {
    setAvisoGps(null);
    if (!('geolocation' in navigator)) { setAvisoGps('Este dispositivo o navegador no permite obtener la ubicación. Busca la localidad o marca el punto en el mapa.'); return; }
    setObteniendoGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setObteniendoGps(false);
        const { latitude, longitude, accuracy } = pos.coords;
        mapaRef.current?.setView([latitude, longitude], 15);
        colocarPinNuevo(latitude, longitude);
        setAvisoGps(`Ubicación del dispositivo obtenida (precisión aproximada: ${Math.round(accuracy)} m). Puedes arrastrar el pin para ajustarla.`);
      },
      (err) => {
        setObteniendoGps(false);
        setAvisoGps(
          err.code === err.PERMISSION_DENIED ? 'No diste permiso para usar tu ubicación. No pasa nada: busca la localidad o marca el punto a mano en el mapa.'
          : err.code === err.TIMEOUT ? 'No se pudo obtener la ubicación a tiempo. Inténtalo de nuevo o marca el punto a mano en el mapa.'
          : 'No se pudo determinar tu ubicación. Busca la localidad o marca el punto a mano en el mapa.',
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }

  function elegirSugerencia(s: SugerenciaLocalidad) {
    suprimirProximaBusquedaRef.current = true;
    setSugerencias([]);
    setBusqueda(s.nombre);
    const mapa = mapaRef.current;
    if (mapa) mapa.setView([s.latitud, s.longitud], ZOOM_AL_BUSCAR);
    // Solo centra/hace zoom -- el pin exacto lo suelta la persona con un clic (ver enunciado: la
    // búsqueda es para navegar el mapa, no reemplaza la selección manual del punto exacto).
  }

  return (
    <div className="selector-ubicacion-mapa">
      <div className="buscador-localidad">
        <input
          type="search"
          placeholder="Buscar localidad para centrar el mapa (ej. Tingo María)…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        {buscando && <p className="comentario-meta">Buscando…</p>}
        {errorBusqueda && <p className="error-formulario">{errorBusqueda}</p>}
        {sugerencias.length > 0 && (
          <ul className="buscador-localidad-sugerencias">
            {sugerencias.map((s) => (
              <li key={s.id}>
                <button type="button" onClick={() => elegirSugerencia(s)}>{s.nombre}</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {permitirGps && (
        <div className="selector-ubicacion-gps">
          <Button type="button" variant="secondary" size="sm" loading={obteniendoGps} iconLeft={<LocateFixed size={16} aria-hidden="true" />} onClick={usarUbicacionActual}>
            Usar mi ubicación actual
          </Button>
          {avisoGps && <p className="comentario-meta" role="status">{avisoGps}</p>}
        </div>
      )}

      <div ref={contenedorRef} className="selector-ubicacion-mapa-lienzo" />

      <p className="comentario-meta">
        {pinNuevo
          ? `Coordenadas seleccionadas: ${pinNuevo.lat.toFixed(5)}, ${pinNuevo.lon.toFixed(5)} -- arrastra el pin para ajustar.`
          : 'Haz clic en el mapa para soltar el pin en la ubicación exacta del cultivo.'}
      </p>
    </div>
  );
}

export default SelectorUbicacionMapa;
