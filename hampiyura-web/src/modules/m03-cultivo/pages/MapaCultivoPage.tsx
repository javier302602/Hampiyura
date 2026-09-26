import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { listarMapaCultivo, type UbicacionCultivoVisible } from '../api/mapa-cultivo.api';
import { CENTRO_PERU_AMAZONICO, agregarTileLayer } from '../leaflet-setup';
import { esValidador, getSession } from '../../../shared/auth/session';
import { listarPlantas, type Planta } from '../../m02-catalogo-plantas/api/plantas.api';

interface Props {
  // Permite que el popup del marcador enlace a la ficha completa de la planta (mismo mecanismo de
  // navegación por estado que usa el resto de la app -- no hay router con URLs propias).
  onSeleccionarPlanta: (plantaId: string) => void;
}

// CG-004 (20/09/2026) + ronda de seguimiento: la vista original era pines sueltos por ficha de
// cultivo, sin búsqueda, filtros ni lista -- no correspondía a la visión de "mapa interactivo tipo
// Google Maps de plantas" del pitch. Ahora es pantalla propia (promovida a ítem de navegación del
// Layout, ver Layout.tsx) con búsqueda + filtros + agrupación de marcadores + panel de lista
// sincronizado + popup enriquecido, manteniendo intacta la protección RN-07 (ver abajo).
//
// RF-271 · mapa de distribución de cultivos registrados. Vista técnica autocontenida: solo
// ubicaciones geográficas, sin ningún texto de precios ni de modelo de negocio (ese modelo --
// "HAMPIYURA Mapa" -- todavía no está validado con nadie externo y queda fuera de esta pantalla;
// ver HAMPIYURA_Mapa_Modelo_Negocio.docx).
function MapaCultivoPage({ onSeleccionarPlanta }: Props) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const mapaRef = useRef<L.Map | null>(null);
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const marcadoresPorIdRef = useRef<Map<string, L.Marker>>(new Map());
  const filasListaRef = useRef<Map<string, HTMLButtonElement>>(new Map());
  // 2.ª capa (Ronda 30): distribución NATURAL documentada de cada especie. Va aparte de los cultivos registrados y nunca se mezcla con ellos.
  const naturalRef = useRef<L.MarkerClusterGroup | null>(null);
  const [plantas, setPlantas] = useState<Planta[]>([]);
  const [verCultivos, setVerCultivos] = useState(true);
  const [verNatural, setVerNatural] = useState(true);

  const [ubicaciones, setUbicaciones] = useState<UbicacionCultivoVisible[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [tipoCultivoFiltro, setTipoCultivoFiltro] = useState('');
  const [familiaFiltro, setFamiliaFiltro] = useState('');
  const [ubicacionActivaId, setUbicacionActivaId] = useState<string | null>(null);

  // Vista de gestión (RF-251): Especialista/Administrador pueden ver también las fichas sin validar.
  const sesion = getSession();
  const puedeVerPendientes = !!sesion && esValidador(sesion.rol);
  const [verPendientes, setVerPendientes] = useState(false);

  useEffect(() => {
    listarMapaCultivo(puedeVerPendientes && verPendientes)
      .then(setUbicaciones)
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar el mapa de distribución.'))
      .finally(() => setCargando(false));
  }, [verPendientes, puedeVerPendientes]);

  useEffect(() => { listarPlantas().then(setPlantas).catch(() => setPlantas([])); }, []);

  // Opciones de los filtros: se derivan de los datos ya cargados en vez de mantener listas fijas
  // que se podrían desincronizar. "Tipo de cultivo" y "familia" son los únicos campos de
  // categorización que ya existen en Cultivo/Planta -- no hay un campo "categoría"/"uso" dedicado
  // (el "uso" de una planta vive en M-04 como una relación aparte vía ParteUso, no como un campo
  // de Planta/Cultivo, así que no se inventa ese cruce aquí).
  const tiposCultivo = useMemo(
    () => Array.from(new Set(ubicaciones.map((u) => u.tipoCultivo))).sort((a, b) => a.localeCompare(b, 'es')),
    [ubicaciones],
  );
  const familias = useMemo(
    () => Array.from(new Set(ubicaciones.map((u) => u.familia))).sort((a, b) => a.localeCompare(b, 'es')),
    [ubicaciones],
  );

  const filtradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return ubicaciones.filter((u) => {
      if (tipoCultivoFiltro && u.tipoCultivo !== tipoCultivoFiltro) return false;
      if (familiaFiltro && u.familia !== familiaFiltro) return false;
      if (!texto) return true;
      return (
        u.nombreComunPlanta.toLowerCase().includes(texto) ||
        u.tipoCultivo.toLowerCase().includes(texto) ||
        u.zona.toLowerCase().includes(texto)
      );
    });
  }, [ubicaciones, busqueda, tipoCultivoFiltro, familiaFiltro]);

  // Puntos de distribución natural que pasan la búsqueda/familia actuales (el filtro de tipo de cultivo no aplica: es propio de las fichas de cultivo).
  const puntosNaturales = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return plantas
      .filter((p) => (p.distribucionNatural?.length ?? 0) > 0 && (!familiaFiltro || p.familia === familiaFiltro)
        && (!texto || p.nombreComun.toLowerCase().includes(texto) || p.nombreCientifico.toLowerCase().includes(texto)))
      .flatMap((p) => (p.distribucionNatural ?? []).map((d) => ({ planta: p, ...d })));
  }, [plantas, busqueda, familiaFiltro]);

  const conCoordenadas = useMemo(() => filtradas.filter((u) => u.latitud !== null && u.longitud !== null), [filtradas]);
  const sinCoordenadas = useMemo(() => filtradas.filter((u) => u.latitud === null || u.longitud === null), [filtradas]);

  // Inicializa el mapa y el grupo de agrupación de marcadores una sola vez.
  useEffect(() => {
    if (!contenedorRef.current || mapaRef.current) return;
    const mapa = L.map(contenedorRef.current).setView(CENTRO_PERU_AMAZONICO, 5);
    agregarTileLayer(mapa);
    const cluster = L.markerClusterGroup();
    cluster.addTo(mapa);
    const natural = L.markerClusterGroup({ iconCreateFunction: (c) => L.divIcon({ html: `<b><i>${c.getChildCount()}</i></b>`, className: 'mapa-natural-cluster', iconSize: [34, 34] }) });
    natural.addTo(mapa);
    mapaRef.current = mapa;
    clusterRef.current = cluster;
    naturalRef.current = natural;
    return () => { mapa.remove(); mapaRef.current = null; clusterRef.current = null; naturalRef.current = null; };
  }, []);

  // Redibuja los marcadores (agrupados) cada vez que cambia el resultado filtrado -- y recentra el
  // mapa sobre esos resultados, para que buscar/filtrar mueva el mapa como en Google Maps.
  useEffect(() => {
    const cluster = clusterRef.current;
    const mapa = mapaRef.current;
    if (!cluster || !mapa) return;
    cluster.clearLayers();
    marcadoresPorIdRef.current.clear();
    for (const u of conCoordenadas) {
      const marcador = L.marker([u.latitud as number, u.longitud as number])
        .bindPopup(crearPopup(u, onSeleccionarPlanta))
        .on('click', () => marcarActiva(u.id));
      marcadoresPorIdRef.current.set(u.id, marcador);
      cluster.addLayer(marcador);
    }
    if (conCoordenadas.length > 0) {
      mapa.fitBounds(cluster.getBounds().pad(0.2));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onSeleccionarPlanta es estable (viene de App.tsx como setState)
  }, [conCoordenadas]);

  // Capa de distribución natural: marcadores propios (rombo azul-verdoso) con popup que aclara que NO es un cultivo registrado.
  useEffect(() => {
    const natural = naturalRef.current;
    if (!natural) return;
    natural.clearLayers();
    for (const d of puntosNaturales) {
      natural.addLayer(L.marker([d.lat, d.lng], { icon: L.divIcon({ html: '<span></span>', className: 'mapa-natural-pin', iconSize: [16, 16] }), title: `${d.planta.nombreComun} — ${d.zona}` })
        .bindPopup(crearPopupNatural(d.planta, d.zona, onSeleccionarPlanta)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puntosNaturales]);

  // Mostrar/ocultar cada capa por separado.
  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa || !clusterRef.current || !naturalRef.current) return;
    if (verCultivos) mapa.addLayer(clusterRef.current); else mapa.removeLayer(clusterRef.current);
    if (verNatural) mapa.addLayer(naturalRef.current); else mapa.removeLayer(naturalRef.current);
  }, [verCultivos, verNatural]);

  // Sin cultivos registrados, el mapa arranca mostrando América (donde están la mayoría de las distribuciones) en vez de un punto vacío.
  useEffect(() => {
    if (!cargando && ubicaciones.length === 0 && mapaRef.current) mapaRef.current.setView([-5, -70], 3);
  }, [cargando, ubicaciones.length]);

  function marcarActiva(id: string) {
    setUbicacionActivaId(id);
    filasListaRef.current.get(id)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function irAUbicacionEnMapa(u: UbicacionCultivoVisible) {
    setUbicacionActivaId(u.id);
    if (u.latitud === null || u.longitud === null) return;
    const mapa = mapaRef.current;
    const marcador = marcadoresPorIdRef.current.get(u.id);
    if (!mapa || !marcador) return;
    mapa.setView([u.latitud, u.longitud], Math.max(mapa.getZoom(), 12));
    marcador.openPopup();
  }

  return (
    <section>
      <h2>Mapa de distribución de cultivos</h2>
      <p className="comentario-meta">
        Dos capas distintas: los cultivos registrados por productores de la comunidad y, aparte, la distribución natural documentada de cada especie. Se usa OpenTopoMap + Leaflet, con relieve y curvas de nivel, sin necesidad de clave de API de pago.
      </p>

      <div className="mapa-leyenda" role="group" aria-label="Capas del mapa">
        <label><input type="checkbox" checked={verCultivos} onChange={(e) => setVerCultivos(e.target.checked)} /> <span className="mapa-leyenda-pin mapa-leyenda-cultivo" aria-hidden="true" /> <strong>Cultivos registrados por la comunidad</strong> (ubicación real que un productor registró)</label>
        <label><input type="checkbox" checked={verNatural} onChange={(e) => setVerNatural(e.target.checked)} /> <span className="mapa-leyenda-pin mapa-natural-pin" aria-hidden="true"><span /></span> <strong>Distribución natural documentada de la especie</strong> (fuente Kew POWO; centro aproximado de un país o región — no es una ubicación de cultivo)</label>
      </div>

      {puedeVerPendientes && (
        <label style={{ display: 'flex', gap: '.5rem', alignItems: 'center', margin: '.5rem 0' }}>
          <input type="checkbox" checked={verPendientes} onChange={(e) => setVerPendientes(e.target.checked)} />
          Vista de gestión: incluir fichas sin validar (no son visibles para el público)
        </label>
      )}

      <div className="mapa-cultivo-controles">
        <label>
          Buscar
          <input
            type="search"
            placeholder="Planta, tipo de cultivo o zona…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </label>
        <label>
          Tipo de cultivo
          <select value={tipoCultivoFiltro} onChange={(e) => setTipoCultivoFiltro(e.target.value)}>
            <option value="">Todos</option>
            {tiposCultivo.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label>
          Familia botánica
          <select value={familiaFiltro} onChange={(e) => setFamiliaFiltro(e.target.value)}>
            <option value="">Todas</option>
            {familias.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </label>
      </div>

      {error && <p className="error-formulario">{error}</p>}

      {/* El contenedor del mapa se mantiene siempre montado (aunque cargando/error) -- Leaflet se
          inicializa una sola vez, al montar, así que si este <div> apareciera condicionado a los
          datos ya cargados, el mapa nunca llegaría a crearse. */}
      {!error && (
        <div className="mapa-cultivo-layout">
          <div ref={contenedorRef} className="mapa-cultivo-mapa" />
          <div className="mapa-cultivo-lista" aria-label="Lista de ubicaciones de cultivo, sincronizada con el mapa">
            {cargando && <p>Cargando ubicaciones…</p>}
            {!cargando && filtradas.length === 0 && ubicaciones.length > 0 && <p>Ninguna ubicación coincide con la búsqueda/filtro actual.</p>}
            {conCoordenadas.map((u) => (
              <button
                key={u.id}
                ref={(el) => { if (el) filasListaRef.current.set(u.id, el); else filasListaRef.current.delete(u.id); }}
                type="button"
                className={`mapa-cultivo-fila${u.id === ubicacionActivaId ? ' mapa-cultivo-fila-activa' : ''}`}
                onClick={() => irAUbicacionEnMapa(u)}
              >
                <strong>{u.nombreComunPlanta}</strong>
                <span>{u.tipoCultivo} · {u.familia}{u.estadoValidacion !== 'Validado' ? ` · ${u.estadoValidacion}` : ''}</span>
                <span className="fuente-cita">{u.zona}</span>
              </button>
            ))}
            {sinCoordenadas.length > 0 && (
              <div style={{ marginTop: conCoordenadas.length > 0 ? '1rem' : 0 }}>
                <p className="nota-cientifico">
                  ℹ {sinCoordenadas.length === 1 ? 'Esta ubicación no muestra' : 'Estas ubicaciones no muestran'} coordenadas exactas
                  en el mapa porque la planta está marcada como en riesgo de conservación -- solo se indica la zona amplia:
                </p>
                <ul>
                  {sinCoordenadas.map((u) => (
                    <li key={u.id}>
                      <strong>{u.nombreComunPlanta}</strong> ({u.tipoCultivo}) — {u.zona}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
      {!cargando && !error && ubicaciones.length === 0 && <p>Todavía no hay ubicaciones de cultivo registradas por productores: esa capa se llenará cuando alguien las registre. Mientras tanto, el mapa muestra la distribución natural documentada de cada especie.</p>}
    </section>
  );
}

// Construye el contenido del popup como nodos DOM reales (no un string de HTML) para poder
// engancharle un manejador de click de verdad al nombre de la planta -- evita innerHTML con datos
// del backend (los `textContent` de abajo ya escapan todo) y evita tener que exponer un callback
// global en window sólo para que un <button> dentro de un string HTML pueda dispararlo.
function crearPopupNatural(p: Planta, zona: string, onSeleccionarPlanta: (plantaId: string) => void): HTMLElement {
  const c = document.createElement('div');
  c.className = 'mapa-cultivo-popup';
  const nombre = document.createElement('button');
  nombre.type = 'button'; nombre.className = 'mapa-cultivo-popup-planta'; nombre.textContent = p.nombreComun; nombre.title = 'Ver ficha completa de la planta';
  nombre.addEventListener('click', () => onSeleccionarPlanta(p.id));
  c.appendChild(nombre);
  const z = document.createElement('div'); z.textContent = `Distribución natural: ${zona}`; c.appendChild(z);
  const aviso = document.createElement('div'); aviso.className = 'fuente-cita';
  aviso.textContent = 'Distribución natural documentada de la especie (Kew POWO) — no es una ubicación de cultivo real registrada por un productor.';
  c.appendChild(aviso);
  return c;
}

function crearPopup(u: UbicacionCultivoVisible, onSeleccionarPlanta: (plantaId: string) => void): HTMLElement {
  const contenedor = document.createElement('div');
  contenedor.className = 'mapa-cultivo-popup';

  const nombre = document.createElement('button');
  nombre.type = 'button';
  nombre.className = 'mapa-cultivo-popup-planta';
  nombre.textContent = u.nombreComunPlanta;
  nombre.title = 'Ver ficha completa de la planta';
  nombre.addEventListener('click', () => onSeleccionarPlanta(u.plantaId));
  contenedor.appendChild(nombre);

  const tipo = document.createElement('div');
  tipo.textContent = u.tipoCultivo;
  contenedor.appendChild(tipo);

  const zona = document.createElement('div');
  zona.className = 'fuente-cita';
  zona.textContent = u.zona;
  contenedor.appendChild(zona);

  const autor = document.createElement('div');
  autor.className = 'mapa-cultivo-popup-autor';
  autor.textContent = `Registrado por: ${u.autorNombre}`;
  contenedor.appendChild(autor);

  return contenedor;
}

export default MapaCultivoPage;
