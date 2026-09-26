import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Smartphone } from 'lucide-react';
import { obtenerCatalogoPlanes, obtenerProductor, solicitarPago, RUTAS_M15, type CatalogoPlanes, type FichaProductor } from '../api/planes.api';
import { subirMedia, leerArchivoComoBase64 } from '../../m06-publicaciones/api/publicaciones.api';
import RequireRole from '../../../shared/auth/RequireRole';
import Button from '../../../shared/ui/Button';
import SectionHeader from '../../../shared/ui/SectionHeader';
import LoadingState from '../../../shared/ui/LoadingState';

// Flujo de pago manual (M-15): la persona paga por Yape o Plin al número de HampiYura, sube la captura del
// comprobante y un administrador lo confirma (o lo rechaza con un motivo). No hay pasarela de pago: el monto lo
// fija el servidor, no este formulario.
function PagarPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const concepto = params.get('concepto') === 'Desbloqueo' ? 'Desbloqueo' : 'Plan';
  const planId = params.get('plan') ?? '';
  const productorId = params.get('productor') ?? '';

  const [catalogo, setCatalogo] = useState<CatalogoPlanes | null>(null);
  const [productor, setProductor] = useState<FichaProductor | null>(null);
  const [metodo, setMetodo] = useState<'Yape' | 'Plin'>('Yape');
  const [numeroOperacion, setNumeroOperacion] = useState('');
  const [comprobanteUrl, setComprobanteUrl] = useState('');
  const [subiendo, setSubiendo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  useEffect(() => { obtenerCatalogoPlanes().then(setCatalogo).catch(() => setError('No se pudieron cargar los datos de cobro.')); }, []);
  useEffect(() => { if (concepto === 'Desbloqueo' && productorId) obtenerProductor(productorId).then(setProductor).catch(() => setError('Este productor no está disponible.')); }, [concepto, productorId]);

  const definicion = catalogo?.planes.find((p) => p.id === (concepto === 'Plan' ? planId : 'DesbloqueoPuntual'));
  const cobro = catalogo?.cobro[metodo === 'Yape' ? 'yape' : 'plin'];
  const titulo = concepto === 'Plan' ? `Plan ${definicion?.nombre ?? planId}` : `Desbloqueo del contacto de ${productor ? (productor.nombreNegocio ?? productor.nombre) : '…'}`;

  async function alElegirArchivo(e: ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;
    setSubiendo(true); setError(null);
    try {
      const { url } = await subirMedia(archivo.name, await leerArchivoComoBase64(archivo));
      setComprobanteUrl(url);
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo subir la captura.'); }
    finally { setSubiendo(false); }
  }

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!comprobanteUrl) { setError('Sube la captura del comprobante de pago.'); return; }
    setEnviando(true); setError(null);
    try {
      await solicitarPago({ concepto, plan: concepto === 'Plan' ? planId : undefined, productorId: concepto === 'Desbloqueo' ? productorId : undefined, metodo, numeroOperacion: numeroOperacion.trim() || undefined, comprobanteUrl });
      setEnviado(true);
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo enviar el pago.'); }
    finally { setEnviando(false); }
  }

  if (!catalogo) return <LoadingState label="Cargando" />;
  if (!definicion) return <section><SectionHeader title="Pago" description="Elige un plan desde la página de planes." /><Button variant="secondary" onClick={() => navigate(RUTAS_M15.planes)}>Ver planes</Button></section>;

  return (
    <section>
      <Button variant="ghost" onClick={() => navigate(RUTAS_M15.planes)}>← Volver a los planes</Button>
      <SectionHeader eyebrow="Pago" title={titulo} description="Paga por Yape o Plin, sube la captura y un administrador confirmará tu pago." />
      <RequireRole permitido={() => true}>
        {enviado ? (
          <div className="pago-enviado" role="status">
            <p className="sello-verificado"><CheckCircle2 size={18} aria-hidden="true" /> Recibimos tu comprobante. Estado: <strong>Pendiente de confirmación</strong>.</p>
            <p>Un administrador lo revisará y te avisaremos en tus notificaciones. Mientras tanto no se activa nada: el acceso empieza cuando el pago quede <strong>Confirmado</strong>.</p>
            <Button variant="primary" onClick={() => navigate(RUTAS_M15.miPlan)}>Ver mis planes y pagos</Button>
          </div>
        ) : (
          <form onSubmit={enviar} className="formulario" style={{ maxWidth: 640 }}>
            <div className="form-section">
              <h3 className="form-section-title">1. Monto a pagar</h3>
              <p className="pago-monto">S/ {definicion.precio.toFixed(2)} <span>{definicion.periodicidad === 'mensual' ? 'por 30 días' : 'por 30 días de acceso a este contacto'}</span></p>
              <p className="comentario-meta">Precio de referencia (hipótesis por validar). El monto exacto lo fija el sistema; no lo puedes cambiar aquí.</p>
            </div>

            <div className="form-section">
              <h3 className="form-section-title">2. Envía el pago</h3>
              <fieldset className="metodo-pago">
                <legend>Método</legend>
                {(['Yape', 'Plin'] as const).map((m) => (
                  <label key={m} className={`metodo-opcion${metodo === m ? ' metodo-opcion-activa' : ''}`}>
                    <input type="radio" name="metodo" value={m} checked={metodo === m} onChange={() => setMetodo(m)} /> <Smartphone size={16} aria-hidden="true" /> {m}
                  </label>
                ))}
              </fieldset>
              {cobro ? (
                <p className="pago-destino">Envía <strong>S/ {definicion.precio.toFixed(2)}</strong> por {metodo} al número <strong>{cobro.numero}</strong> (a nombre de {cobro.titular}).</p>
              ) : (
                <p className="advertencia-no-verificado">⚠ El administrador todavía no configuró el número de {metodo}. Modo demostración: puedes subir un comprobante de prueba, pero el pago real aún no está habilitado.</p>
              )}
            </div>

            <div className="form-section">
              <h3 className="form-section-title">3. Sube tu comprobante</h3>
              <label>
                Captura del comprobante ({metodo})
                <input type="file" accept="image/*" onChange={alElegirArchivo} disabled={subiendo} required={!comprobanteUrl} />
              </label>
              {subiendo && <p className="comentario-meta">Subiendo captura…</p>}
              {comprobanteUrl && <img src={comprobanteUrl} alt="Vista previa del comprobante" className="comprobante-preview" />}
              <label>
                Número de operación (opcional)
                <input type="text" value={numeroOperacion} onChange={(e) => setNumeroOperacion(e.target.value)} maxLength={40} placeholder="Ej. 123456789" />
              </label>
            </div>

            <div className="form-section">
              {error && <p className="error-formulario" role="alert">{error}</p>}
              <Button type="submit" variant="primary" loading={enviando} disabled={subiendo}>{enviando ? 'Enviando…' : 'Enviar comprobante'}</Button>
              <p className="comentario-meta">No hay reembolso automático: si algo sale mal, el equipo lo resuelve manualmente contigo.</p>
            </div>
          </form>
        )}
      </RequireRole>
    </section>
  );
}

export default PagarPage;
