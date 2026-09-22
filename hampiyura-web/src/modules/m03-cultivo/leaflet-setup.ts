import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

// Base compartida de Leaflet para todo M-03 (MapaCultivoPage y SelectorUbicacionMapa) -- un solo
// lugar para el fix del ícono, el tile layer y el centro por defecto, para no reimplementar el
// mapa en cada pantalla nueva que lo necesite. El retinte de tema oscuro de los controles/popups
// de Leaflet vive en styles.css (selectores globales .leaflet-*), así que se aplica automáticamente
// a cualquier mapa que use este módulo, sin nada adicional que importar aquí.

// Fix del ícono por defecto de Leaflet bajo un bundler (las rutas relativas del paquete no
// resuelven con Vite) -- workaround oficial documentado por el propio proyecto Leaflet. Efecto de
// módulo, se aplica una sola vez sin importar cuántas pantallas importen este archivo.
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

// Centro aproximado de la Amazonía peruana -- solo el punto de partida del mapa, sin ninguna
// ubicación real marcada ahí.
export const CENTRO_PERU_AMAZONICO: [number, number] = [-9.5, -75];

export function agregarTileLayer(mapa: L.Map): L.TileLayer {
  return L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://opentopomap.org">OpenTopoMap</a> contributors',
    maxZoom: 17,
  }).addTo(mapa);
}

// Ícono del pin "nuevo" que el usuario está ubicando (SelectorUbicacionMapa) -- un círculo simple
// en el color de acento de la app, para distinguirlo a simple vista de los pines de referencia
// (ubicaciones ya registradas), que usan el ícono azul por defecto de Leaflet.
export function iconoPinNuevo(): L.DivIcon {
  return L.divIcon({
    className: 'pin-nuevo-ubicacion',
    html: '<span></span>',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}
