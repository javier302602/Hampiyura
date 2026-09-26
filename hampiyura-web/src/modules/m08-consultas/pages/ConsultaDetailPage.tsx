import { FormEvent, useEffect, useState } from 'react';
import { obtenerConsulta, agregarMensajeConsulta, cerrarConsulta, reabrirConsulta, marcarConsultaEnProceso, marcarConsultaResuelta, ETIQUETAS_TIPO_CONSULTA, ETIQUETAS_ESTADO_CONSULTA, esResuelta, type ConsultaConHilo } from '../api/consultas.api';
import Button from '../../../shared/ui/Button';
import IndicadorPrioridad from '../components/IndicadorPrioridad';
import MiniMapaUbicacion from '../../m03-cultivo/components/MiniMapaUbicacion';
import { getSession, esValidador } from '../../../shared/auth/session';

// Pantalla compartida entre "Mis consultas" (RF-263) y la bandeja del equipo (RF-264) -- mismo
// hilo de mensajes (RF-266), no se duplica la pantalla para cada caso, solo cambian los botones
// disponibles según quién mira (autor vs. equipo).
function ConsultaDetailPage({ consultaId, onVolver }: { consultaId: string; onVolver: () => void }) {
  const [consulta, setConsulta] = useState<ConsultaConHilo | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contenido, setContenido] = useState('');
  const [enviando, setEnviando] = useState(false);
  const sesion = getSession();

  function cargar() {
    setCargando(true);
    setError(null);
    obtenerConsulta(consultaId).then(setConsulta).catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar la consulta.')).finally(() => setCargando(false));
  }
  useEffect(cargar, [consultaId]);

  async function manejarEnviarMensaje(e: FormEvent) {
    e.preventDefault();
    if (!contenido.trim()) return;
    setEnviando(true);
    setError(null);
    try { await agregarMensajeConsulta(consultaId, contenido.trim()); setContenido(''); cargar(); }
    catch (err) { setError(err instanceof Error ? err.message : 'No se pudo enviar el mensaje.'); }
    finally { setEnviando(false); }
  }
  async function manejarCambioEquipo(accion: () => Promise<unknown>, mensajeError: string) {
    setError(null);
    try { await accion(); cargar(); }
    catch (err) { setError(err instanceof Error ? err.message : mensajeError); }
  }
  async function manejarCerrar() {
    setError(null);
    try { await cerrarConsulta(consultaId); cargar(); }
    catch (err) { setError(err instanceof Error ? err.message : 'No se pudo cerrar la consulta.'); }
  }
  async function manejarReabrir() {
    setError(null);
    try { await reabrirConsulta(consultaId); cargar(); }
    catch (err) { setError(err instanceof Error ? err.message : 'No se pudo reabrir la consulta.'); }
  }

  if (cargando) return <p>Cargando consulta…</p>;
  if (error && !consulta) return <p>{error}</p>;
  if (!consulta) return <p>No se encontró la consulta.</p>;

  const esAutor = !!sesion && sesion.userId === consulta.autorId;
  const esEquipo = !!sesion && esValidador(sesion.rol);
  const puedeActuar = esAutor || esEquipo;
  const estaCerrada = consulta.estado === 'Cerrada';

  function etiquetaAutorMensaje(m: ConsultaConHilo['mensajes'][number]): string {
    if (m.esEquipo) return 'Equipo';
    if (sesion && m.autorId === sesion.userId) return 'Tú';
    return 'Autor';
  }

  return (
    <section>
      <Button variant="ghost" size="sm" onClick={onVolver}>← Volver</Button>
      <h2>{ETIQUETAS_TIPO_CONSULTA[consulta.tipo]}</h2>
      <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
        <span className="badge badge-estado">{ETIQUETAS_ESTADO_CONSULTA[consulta.estado]}</span>
        {consulta.prioritaria && <span className="badge badge-prioritaria">★ Prioritaria</span>}
        {consulta.areaAsignada && <span className="badge badge-estado">Área: {consulta.areaAsignada}</span>}
      </div>
      <IndicadorPrioridad prioridad={consulta.prioridad} />
      <p>{consulta.descripcion}</p>
      {consulta.imagenes && consulta.imagenes.length > 0 && (
        <div className="detalle-imagenes">
          {consulta.imagenes.map((url) => <a key={url} href={url} target="_blank" rel="noopener noreferrer"><img src={url} alt="Foto adjunta a la consulta" /></a>)}
        </div>
      )}
      {consulta.latitud != null && consulta.longitud != null && (
        <div style={{ maxWidth: 520 }}>
          <p className="comentario-meta">Ubicación indicada: {consulta.latitud.toFixed(5)}, {consulta.longitud.toFixed(5)}</p>
          <MiniMapaUbicacion latitud={consulta.latitud} longitud={consulta.longitud} etiqueta="Ubicación de la consulta" />
        </div>
      )}
      <span className="comentario-meta">Creada: {new Date(consulta.fechaCreacion).toLocaleString()}</span>

      <h3>Mensajes</h3>
      {consulta.mensajes.length === 0 && <p>Todavía no hay mensajes en esta consulta.</p>}
      {consulta.mensajes.map((m) => (
        <div key={m.id} className="comentario">
          <strong>{etiquetaAutorMensaje(m)}</strong>
          <p style={{ margin: '.2em 0' }}>{m.contenido}</p>
          <span className="comentario-meta">{new Date(m.fecha).toLocaleString()}</span>
        </div>
      ))}

      {error && <p className="error-formulario">{error}</p>}

      {puedeActuar && !estaCerrada && (
        <form onSubmit={manejarEnviarMensaje} className="formulario">
          <label>
            {esEquipo ? 'Responder' : 'Agregar mensaje'}
            <textarea value={contenido} onChange={(e) => setContenido(e.target.value)} required />
          </label>
          <button type="submit" disabled={enviando || !contenido.trim()}>{enviando ? 'Enviando…' : esEquipo ? 'Responder' : 'Enviar mensaje'}</button>
        </form>
      )}

      {esEquipo && (
        <div style={{ marginTop: '1rem' }}>
          <h3>Estado de la consulta</h3>
          <p className="comentario-meta">Ahora: <strong>{ETIQUETAS_ESTADO_CONSULTA[consulta.estado]}</strong>. Cada cambio le avisa a quien preguntó.</p>
          <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
            {consulta.estado === 'Pendiente' && <Button size="sm" variant="secondary" onClick={() => manejarCambioEquipo(() => marcarConsultaEnProceso(consultaId), 'No se pudo cambiar el estado.')}>Marcar en proceso</Button>}
            {(consulta.estado === 'Pendiente' || consulta.estado === 'EnRevision') && <Button size="sm" onClick={() => manejarCambioEquipo(() => marcarConsultaResuelta(consultaId), 'No se pudo cambiar el estado.')}>Marcar como resuelta</Button>}
            {esResuelta(consulta.estado) && <Button size="sm" variant="secondary" onClick={manejarReabrir}>Reabrir consulta</Button>}
          </div>
        </div>
      )}

      {esAutor && !esEquipo && (
        <div style={{ marginTop: '1rem', display: 'flex', gap: '.5rem' }}>
          {!estaCerrada && <button onClick={manejarCerrar}>Cerrar consulta</button>}
          {esResuelta(consulta.estado) && <button onClick={manejarReabrir}>Reabrir consulta</button>}
        </div>
      )}
    </section>
  );
}

export default ConsultaDetailPage;
