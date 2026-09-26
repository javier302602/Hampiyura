import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Eye, FlaskConical } from 'lucide-react';
import { listarPendientes, aprobar, observar, rechazar, type ValidacionPendiente } from '../api/validaciones.api';
import { listarSeguimiento, type ItemSeguimiento } from '../../m04-usos-partes/api/partes-uso.api';
import DetalleValidacionModal from '../components/DetalleValidacionModal';
import DetalleSeguimientoModal from '../components/DetalleSeguimientoModal';
import Button from '../../../shared/ui/Button';
import Badge from '../../../shared/ui/Badge';

type Pestana = 'pendientes' | 'seguimiento';

// Cada tarjeta abre una vista de detalle con TODO lo que envió quien propuso el contenido; las tres
// decisiones (aprobar / observar / rechazar) viven ahí, para decidir habiendo visto el contenido completo.
// Segunda pestaña: usos ya aprobados (Tradicional, Documentado o Científico) que todavía no tienen validación científica
// registrada -- el camino a "verificado" es el mismo para los tres.
function BandejaValidacionPage() {
  const [pestana, setPestana] = useState<Pestana>('pendientes');
  // El panel de trabajo llega aquí con ?area=mia: solo las pendientes que le corresponden al rol (el servidor filtra).
  const [params] = useSearchParams();
  const [soloMiArea, setSoloMiArea] = useState(params.get('area') === 'mia');
  const [pendientes, setPendientes] = useState<ValidacionPendiente[]>([]);
  const [seguimiento, setSeguimiento] = useState<ItemSeguimiento[] | null>(null);
  const [errorSeguimiento, setErrorSeguimiento] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [abierta, setAbierta] = useState<string | null>(null);
  const [seguimientoAbierto, setSeguimientoAbierto] = useState<string | null>(null);

  function cargar() {
    setCargando(true);
    listarPendientes(soloMiArea)
      .then(setPendientes)
      .catch(() => setError('No se pudo cargar la bandeja de pendientes.'))
      .finally(() => setCargando(false));
  }
  function cargarSeguimiento() {
    setErrorSeguimiento(null);
    listarSeguimiento().then(setSeguimiento).catch((e) => { setSeguimiento([]); setErrorSeguimiento(e instanceof Error ? e.message : 'No se pudo cargar el seguimiento.'); });
  }
  useEffect(cargar, [soloMiArea]);
  useEffect(() => { if (pestana === 'seguimiento') cargarSeguimiento(); }, [pestana]);

  async function manejarAprobar(id: string) { await aprobar(id); cargar(); }
  async function manejarObservar(id: string, comentario: string) { await observar(id, comentario); cargar(); }
  async function manejarRechazar(id: string, comentario: string) { await rechazar(id, comentario); cargar(); }

  if (cargando) return <p>Cargando bandeja de validación…</p>;
  if (error) return <p>{error}</p>;

  return (
    <section className="gestion-panel">
      <h2>Bandeja de validación</h2>
      <div role="tablist" aria-label="Secciones de la bandeja" style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <Button role="tab" aria-selected={pestana === 'pendientes'} size="sm" variant={pestana === 'pendientes' ? 'primary' : 'secondary'} onClick={() => setPestana('pendientes')}>Pendientes de revisión ({pendientes.length})</Button>
        <Button role="tab" aria-selected={pestana === 'seguimiento'} size="sm" variant={pestana === 'seguimiento' ? 'primary' : 'secondary'} iconLeft={<FlaskConical size={15} aria-hidden="true" />} onClick={() => setPestana('seguimiento')}>Pendientes de validación científica</Button>
      </div>

      {pestana === 'pendientes' && (
        <p className="comentario-meta" role="status" style={{ display: 'flex', gap: '.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {soloMiArea ? 'Mostrando solo las pendientes de tu área de especialidad.' : 'Mostrando todas las pendientes.'}
          <Button size="sm" variant="secondary" onClick={() => setSoloMiArea((v) => !v)}>{soloMiArea ? 'Ver todas' : 'Ver solo las de mi área'}</Button>
        </p>
      )}

      {pestana === 'pendientes' && (pendientes.length === 0 ? (
        <p>No hay contenido pendiente de revisión.</p>
      ) : (
        <div className="cards">
          {pendientes.map((v) => (
            <article key={v.id} className="tarjeta-clicable" style={{ flex: '1 1 300px' }} tabIndex={0} role="button" aria-label={`Ver detalle: ${v.etiqueta}`}
              onClick={() => setAbierta(v.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setAbierta(v.id); } }}>
              <span className="badge badge-estado">{v.tipoEntidad === 'SolicitudCuenta' ? 'Solicitud de cuenta' : v.tipoEntidad}</span>
              <strong>{v.etiqueta}</strong>
              <span>{new Date(v.fecha).toLocaleString()}</span>
              <div style={{ marginTop: '.5rem' }}>
                <Button size="sm" variant="secondary" iconLeft={<Eye size={15} aria-hidden="true" />} tabIndex={-1} onClick={(e) => { e.stopPropagation(); setAbierta(v.id); }}>Ver detalle y decidir</Button>
              </div>
            </article>
          ))}
        </div>
      ))}

      {pestana === 'seguimiento' && (
        <>
          <p className="comentario-meta">Usos ya aprobados en moderación, sea cual sea su tipo de conocimiento (<strong>Tradicional, Documentado o Científico</strong>). Aprobarlos no los hace “verificados”, ni siquiera si se declararon científicos: para eso hace falta una validación científica con evidencia real, que se registra aquí.</p>
          {errorSeguimiento && <p className="error-formulario" role="alert">{errorSeguimiento}</p>}
          {seguimiento === null ? <p>Cargando…</p> : seguimiento.length === 0 && !errorSeguimiento ? <p>No hay usos aprobados pendientes de validación científica.</p> : (
            <div className="cards">
              {seguimiento.map((s) => (
                <article key={s.id} className="tarjeta-clicable" style={{ flex: '1 1 300px' }} tabIndex={0} role="button" aria-label={`Seguimiento: ${s.etiqueta}`}
                  onClick={() => setSeguimientoAbierto(s.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSeguimientoAbierto(s.id); } }}>
                  <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
                    {s.validadaCientificamente ? <Badge variant="success">Validado científicamente</Badge> : <Badge variant="warning">{s.tipoConocimiento} · sin validar</Badge>}
                    {!s.validadaCientificamente && s.tieneContactoSeguimiento && <Badge variant="info">Con contacto de seguimiento</Badge>}
                  </div>
                  <strong>{s.etiqueta}</strong>
                  <span className="comentario-meta">Propuesto por {s.autorNombre}</span>
                  <div style={{ marginTop: '.5rem' }}>
                    <Button size="sm" variant="secondary" iconLeft={<FlaskConical size={15} aria-hidden="true" />} tabIndex={-1} onClick={(e) => { e.stopPropagation(); setSeguimientoAbierto(s.id); }}>Ver seguimiento</Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {abierta && (
        <DetalleValidacionModal validacionId={abierta} onCerrar={() => setAbierta(null)} onAprobar={manejarAprobar} onObservar={manejarObservar} onRechazar={manejarRechazar} />
      )}
      {seguimientoAbierto && <DetalleSeguimientoModal id={seguimientoAbierto} onCerrar={() => setSeguimientoAbierto(null)} onCambio={cargarSeguimiento} />}
    </section>
  );
}

export default BandejaValidacionPage;
