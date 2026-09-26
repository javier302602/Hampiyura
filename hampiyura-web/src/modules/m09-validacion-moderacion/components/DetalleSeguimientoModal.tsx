import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { FlaskConical, ShieldCheck } from 'lucide-react';
import { obtenerSeguimiento, guardarContactoSeguimiento, registrarValidacionCientifica, type DetalleSeguimiento } from '../../m04-usos-partes/api/partes-uso.api';
import { subirMedia, leerArchivoComoBase64 } from '../../m06-publicaciones/api/publicaciones.api';
import Modal from '../../../shared/ui/Modal';
import Button from '../../../shared/ui/Button';
import Badge from '../../../shared/ui/Badge';

const MIN_CARACTERES = 40;
const MIN_PALABRAS = 6;
const hoyISO = () => new Date().toISOString().slice(0, 10);
const fecha = (s: string) => new Date(s).toLocaleDateString('es-PE');

// Seguimiento de un uso TRADICIONAL ya aprobado: nota interna de contacto y el camino a la validación científica.
// Es una acción SEPARADA de Aprobar/Observar/Rechazar (esas ya se hicieron). Solo Especialista en salud / Administrador.
function DetalleSeguimientoModal({ id, onCerrar, onCambio }: { id: string; onCerrar: () => void; onCambio: () => void }) {
  const [detalle, setDetalle] = useState<DetalleSeguimiento | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [contacto, setContacto] = useState('');
  const [guardandoContacto, setGuardandoContacto] = useState(false);
  const [contactoGuardado, setContactoGuardado] = useState(false);
  const [formulario, setFormulario] = useState(false);

  // formulario de validación científica
  const [especialista, setEspecialista] = useState('');
  const [fechaPrueba, setFechaPrueba] = useState('');
  const [evidencia, setEvidencia] = useState('');
  const [enlace, setEnlace] = useState('');
  const [subiendo, setSubiendo] = useState(false);
  const [enviando, setEnviando] = useState(false);

  function cargar() {
    obtenerSeguimiento(id).then((d) => { setDetalle(d); setContacto(d.contactoSeguimiento ?? ''); }).catch((e) => setError(e instanceof Error ? e.message : 'No se pudo cargar el detalle.'));
  }
  useEffect(cargar, [id]);

  async function guardarContacto() {
    setGuardandoContacto(true); setError(null); setContactoGuardado(false);
    try { await guardarContactoSeguimiento(id, contacto); setContactoGuardado(true); onCambio(); }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudo guardar el contacto.'); }
    finally { setGuardandoContacto(false); }
  }

  async function alElegirDocumento(e: ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;
    setSubiendo(true); setError(null);
    try { setEnlace((await subirMedia(archivo.name, await leerArchivoComoBase64(archivo))).url); }
    catch (err) { setError(err instanceof Error ? err.message : 'No se pudo subir el documento.'); }
    finally { setSubiendo(false); }
  }

  const palabras = evidencia.trim().split(/\s+/).filter(Boolean).length;
  const evidenciaSuficiente = evidencia.trim().length >= MIN_CARACTERES && palabras >= MIN_PALABRAS;
  const formularioCompleto = especialista.trim().length >= 3 && !!fechaPrueba && evidenciaSuficiente;

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setEnviando(true); setError(null);
    try {
      await registrarValidacionCientifica(id, { especialista, fecha: fechaPrueba, evidencia, enlace: enlace.trim() || undefined });
      onCambio(); onCerrar();
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo registrar la validación científica.'); }
    finally { setEnviando(false); }
  }

  const v = detalle?.validacionCientifica;
  return (
    <Modal titulo={formulario ? 'Registrar validación científica' : (detalle?.etiqueta ?? 'Seguimiento del uso')} onCerrar={onCerrar}
      pie={detalle && !formulario && detalle.puedeRegistrarValidacionCientifica ? (
        <>
          <div className="modal-pie-acciones">
            <Button variant="primary" iconLeft={<FlaskConical size={16} aria-hidden="true" />} onClick={() => { setFormulario(true); setError(null); }}>Registrar validación científica</Button>
          </div>
        </>
      ) : undefined}>
      {!detalle && !error && <p>Cargando…</p>}
      {!detalle && error && <p className="error-formulario" role="alert">{error}</p>}

      {detalle && !formulario && (
        <>
          <div className="detalle-meta">
            <Badge variant="neutral">{detalle.tipoConocimiento}</Badge>
            <Badge variant="success">Aprobado en moderación</Badge>
            <p>Propuesto por <strong>{detalle.autorNombre}</strong></p>
          </div>
          <dl className="detalle-campos">
            {detalle.campos.map((c) => <div key={c.etiqueta}><dt>{c.etiqueta}</dt><dd>{c.valor}</dd></div>)}
          </dl>

          {v ? (
            <section className="detalle-relacionado" aria-label="Validación científica registrada">
              <h3><ShieldCheck size={17} aria-hidden="true" /> Validado científicamente</h3>
              <p className="comentario-meta">Esta evidencia la ve solo el equipo. El público solo ve el sello de “verificado”.</p>
              <dl className="detalle-campos">
                <div><dt>Especialista o institución</dt><dd>{v.especialista}</dd></div>
                <div><dt>Fecha de la prueba</dt><dd>{fecha(v.fecha)}</dd></div>
                <div><dt>Evidencia</dt><dd>{v.evidencia}</dd></div>
                {v.enlace && <div><dt>Estudio o documento</dt><dd><a href={v.enlace} target="_blank" rel="noopener noreferrer">{v.enlace}</a></dd></div>}
                <div><dt>Registrado por</dt><dd>{v.registradaPorNombre} · {fecha(v.registradaEn)}</dd></div>
              </dl>
            </section>
          ) : (
            <section className="detalle-relacionado" aria-label="Contacto de seguimiento">
              <h3>Contacto de seguimiento</h3>
              <p className="comentario-meta">Nota interna del equipo: un teléfono o correo para contactar a quien aportó este conocimiento, o a un especialista dispuesto a evaluarlo. <strong>Nunca se muestra al público.</strong></p>
              <label style={{ display: 'grid', gap: 'var(--space-1)', fontWeight: 600 }}>
                Teléfono o correo
                <input type="text" value={contacto} onChange={(e) => { setContacto(e.target.value); setContactoGuardado(false); }} maxLength={120} placeholder="Ej. +51 987 654 321 o especialista@universidad.edu.pe" />
              </label>
              <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', flexWrap: 'wrap' }}>
                <Button variant="secondary" size="sm" loading={guardandoContacto} onClick={guardarContacto}>Guardar contacto</Button>
                {contactoGuardado && <span className="sello-verificado" role="status">✔ Guardado</span>}
              </div>
              {error && <p className="error-formulario" role="alert">{error}</p>}
            </section>
          )}
        </>
      )}

      {detalle && formulario && (
        <form onSubmit={enviar} className="formulario" style={{ maxWidth: 'none', padding: 0, border: 'none', background: 'none', boxShadow: 'none', marginTop: 0 }}>
          <p className="aviso-legal" role="note">Al guardar, este uso pasa de “Tradicional” a <strong>validado científicamente</strong> y podrá mostrarse al público como verificado. Solo registra esto si de verdad existe una prueba concreta.</p>
          <label>
            Especialista o institución que hizo la prueba
            <input type="text" value={especialista} onChange={(e) => setEspecialista(e.target.value)} maxLength={150} placeholder="Ej. Laboratorio de Fitoquímica, UNAS" required />
          </label>
          <label>
            Fecha de la prueba
            <input type="date" value={fechaPrueba} max={hoyISO()} onChange={(e) => setFechaPrueba(e.target.value)} required />
          </label>
          <label>
            Evidencia: ¿qué prueba se hizo, cómo y qué resultado dio?
            <textarea value={evidencia} onChange={(e) => setEvidencia(e.target.value)} rows={5} required placeholder="Ej. Ensayo in vitro de actividad antiinflamatoria con extracto acuoso de hoja seca; reducción medible frente al control (n=3)." />
            <span className={evidenciaSuficiente ? 'comentario-meta' : 'comentario-meta'} role="status">
              {evidenciaSuficiente ? '✔ Descripción suficiente.' : `Falta detalle: mínimo ${MIN_CARACTERES} caracteres y ${MIN_PALABRAS} palabras (llevas ${evidencia.trim().length} y ${palabras}). Un “se probó” genérico no se acepta.`}
            </span>
          </label>
          <label>
            Enlace al estudio (opcional)
            <input type="url" value={enlace.startsWith('/uploads/') ? '' : enlace} onChange={(e) => setEnlace(e.target.value)} placeholder="https://doi.org/…" />
          </label>
          <label>
            …o adjunta el documento (PDF o imagen, opcional)
            <input type="file" accept="application/pdf,image/*" onChange={alElegirDocumento} disabled={subiendo} />
          </label>
          {subiendo && <p className="comentario-meta">Subiendo documento…</p>}
          {enlace.startsWith('/uploads/') && <p className="sello-verificado" role="status">✔ Documento adjunto: <a href={enlace} target="_blank" rel="noopener noreferrer">verlo</a> · <button type="button" className="enlace-boton" onClick={() => setEnlace('')}>quitar</button></p>}
          {error && <p className="error-formulario" role="alert">{error}</p>}
          <div className="modal-pie-acciones">
            <Button type="submit" variant="primary" loading={enviando} disabled={!formularioCompleto || subiendo}>Guardar validación científica</Button>
            <Button type="button" variant="ghost" onClick={() => { setFormulario(false); setError(null); }}>Cancelar</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export default DetalleSeguimientoModal;
