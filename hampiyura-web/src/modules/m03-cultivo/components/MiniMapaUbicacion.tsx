import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { agregarTileLayer } from '../leaflet-setup';

interface Props {
  latitud: number;
  longitud: number;
  etiqueta?: string;
}

const ZOOM_FIJO = 13;

// Mini-mapa de solo lectura para mostrar un único punto (ficha de producto, Frente 6) -- reusa el
// mismo tile layer con relieve (OpenTopoMap) y el mismo fix de ícono que MapaCultivoPage y
// SelectorUbicacionMapa (leaflet-setup.ts), no una paleta/base nueva. A diferencia de esos dos, no
// es para navegar: arrastre, zoom con rueda/doble clic/teclado y el control de zoom quedan
// deshabilitados a propósito -- solo confirma visualmente dónde queda la localidad guardada.
function MiniMapaUbicacion({ latitud, longitud, etiqueta }: Props) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const mapaRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!contenedorRef.current) return;
    const mapa = L.map(contenedorRef.current, {
      center: [latitud, longitud],
      zoom: ZOOM_FIJO,
      zoomControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      touchZoom: false,
      attributionControl: true,
    });
    agregarTileLayer(mapa);
    L.marker([latitud, longitud]).addTo(mapa);
    mapaRef.current = mapa;
    return () => { mapa.remove(); mapaRef.current = null; };
  }, [latitud, longitud]);

  return (
    <div className="mini-mapa-ubicacion">
      <div ref={contenedorRef} className="mini-mapa-ubicacion-lienzo" role="img" aria-label={`Mapa de la ubicación: ${etiqueta ?? `${latitud}, ${longitud}`}`} />
    </div>
  );
}

export default MiniMapaUbicacion;
