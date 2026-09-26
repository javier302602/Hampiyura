import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { obtenerPanel, type PanelAdmin } from '../api/admin.api';

// Cada tarjeta lleva a la lista que la respalda, ya filtrada. Las que NO tienen una lista propia (totales sin vista, o cifras sin
// ventas todavía) quedan como tarjeta simple, sin enlace: no se inventa un destino.
function Tarjeta({ valor, etiqueta, nota, to }: { valor: number | string; etiqueta: string; nota?: string; to?: string }) {
  const contenido = <><strong>{valor}</strong><span>{etiqueta}</span>{nota && <span className="comentario-meta">{nota}</span>}</>;
  if (!to) return <article>{contenido}</article>;
  return <article className="tarjeta-enlace"><Link to={to} aria-label={`${etiqueta}: ${valor}. Ver la lista`}>{contenido}<span className="tarjeta-enlace-ir" aria-hidden="true">Ver lista <ChevronRight size={14} /></span></Link></article>;
}

// El servidor decide qué manda según el rol (ver ObtenerPanelAdminUseCase): un especialista solo recibe su trabajo.
// Esta pantalla solo dibuja lo que llega -- no "esconde" cifras que ya hubieran viajado al navegador.
function PanelAdminPage() {
  const [panel, setPanel] = useState<PanelAdmin | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    obtenerPanel().then(setPanel).catch(() => setError('No se pudo cargar el panel de administración.'));
  }, []);

  if (error) return <p>{error}</p>;
  if (!panel) return <p>Cargando panel…</p>;

  const completo = panel.alcance === 'completo';

  return (
    <section className="gestion-panel">
      <h2>{completo ? 'Panel de administración' : 'Mi panel de trabajo'}</h2>
      {!completo && <p className="comentario-meta">Ves lo que corresponde a tu área de especialidad: validaciones, reportes y consultas.</p>}

      <h3>{completo ? 'Plataforma' : 'Pendientes de tu área'}</h3>
      <div className="cards panel-stats">
        <Tarjeta valor={panel.validacionesPendientes} etiqueta="Validaciones pendientes" to="/m09-validacion-moderacion/bandeja" />
        {completo && (
          <>
            <Tarjeta valor={panel.usuariosRegistrados} etiqueta="Usuarios registrados" to="/m13-analitica-estadisticas/usuarios" />
            <Tarjeta valor={panel.usuariosActivos} etiqueta="Usuarios activos" to="/m13-analitica-estadisticas/usuarios" />
            <Tarjeta valor={panel.plantasPublicadas} etiqueta="Plantas publicadas" to="/m02-catalogo-plantas" />
            <Tarjeta valor={panel.publicacionesRealizadas} etiqueta="Publicaciones realizadas" to="/m06-publicaciones" />
          </>
        )}
      </div>

      <h3 style={{ marginTop: '1.5rem' }}>Consultas</h3>
      <div className="cards panel-stats">
        <Tarjeta valor={panel.consultas.pendientes} etiqueta="Consultas pendientes" to="/m08-consultas/bandeja?estado=Pendiente" />
        <Tarjeta valor={panel.consultas.enProceso} etiqueta="Consultas en proceso" to="/m08-consultas/bandeja?estado=EnRevision" />
        <Tarjeta valor={panel.consultas.resueltas} etiqueta="Consultas resueltas" to="/m08-consultas/bandeja?estado=Resuelta" />
      </div>

      <h3 style={{ marginTop: '1.5rem' }}>Reportes de contenido</h3>
      <div className="cards panel-stats">
        <Tarjeta valor={panel.reportes.pendientes} etiqueta="Reportes pendientes" to="/m09-validacion-moderacion/reportes?estado=Pendiente" />
        <Tarjeta valor={panel.reportes.revisados} etiqueta="Reportes revisados" to="/m09-validacion-moderacion/reportes?estado=Revisado" />
        <Tarjeta valor={panel.reportes.desestimados} etiqueta="Reportes desestimados" to="/m09-validacion-moderacion/reportes?estado=Desestimado" />
      </div>

      {panel.alcance === 'completo' && (
        <>
          <h3 style={{ marginTop: '1.5rem' }}>Pagos de contacto</h3>
          <div className="cards panel-stats">
            <Tarjeta valor={panel.pagos.pendientesDeConfirmar} etiqueta="Pagos por confirmar" to="/m15-planes/pagos?estado=Pendiente" />
            <Tarjeta valor={panel.pagos.confirmados} etiqueta="Pagos confirmados" to="/m15-planes/pagos?estado=Confirmado" />
            <Tarjeta valor={panel.pagos.rechazados} etiqueta="Pagos rechazados" to="/m15-planes/pagos?estado=Rechazado" />
          </div>

          <h3 style={{ marginTop: '1.5rem' }}>Planes y desbloqueos vigentes</h3>
          <div className="cards panel-stats">
            <Tarjeta valor={panel.accesos.planesActivos} etiqueta="Planes activos" to="/m15-planes/pagos?estado=Confirmado" />
            <Tarjeta valor={panel.accesos.desbloqueosVigentes} etiqueta="Desbloqueos vigentes" to="/m15-planes/pagos?estado=Confirmado" />
          </div>

          <h3 style={{ marginTop: '1.5rem' }}>Publicar producto y comisión</h3>
          <div className="cards panel-stats">
            <Tarjeta valor={panel.comision.productosPublicados} etiqueta="Productos publicados" to="/m11-productos-emprendimientos" />
            <Tarjeta valor={panel.comision.productoresQueAceptaron} etiqueta={`Productores que aceptaron el ${panel.comision.porcentaje}%`} />
            <Tarjeta valor="Sin datos" etiqueta="Comisión acumulada" nota="Aún no se registran ventas en la plataforma." />
          </div>
        </>
      )}
    </section>
  );
}

export default PanelAdminPage;
