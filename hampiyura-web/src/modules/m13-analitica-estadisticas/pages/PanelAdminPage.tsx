import { useEffect, useState } from 'react';
import { obtenerPanel, type PanelAdmin } from '../api/admin.api';

function Tarjeta({ valor, etiqueta, nota }: { valor: number | string; etiqueta: string; nota?: string }) {
  return <article><strong>{valor}</strong><span>{etiqueta}</span>{nota && <span className="comentario-meta">{nota}</span>}</article>;
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
        <Tarjeta valor={panel.validacionesPendientes} etiqueta="Validaciones pendientes" />
        {completo && (
          <>
            <Tarjeta valor={panel.usuariosRegistrados} etiqueta="Usuarios registrados" />
            <Tarjeta valor={panel.usuariosActivos} etiqueta="Usuarios activos" />
            <Tarjeta valor={panel.plantasPublicadas} etiqueta="Plantas publicadas" />
            <Tarjeta valor={panel.publicacionesRealizadas} etiqueta="Publicaciones realizadas" />
          </>
        )}
      </div>

      <h3 style={{ marginTop: '1.5rem' }}>Consultas</h3>
      <div className="cards panel-stats">
        <Tarjeta valor={panel.consultas.pendientes} etiqueta="Consultas pendientes" />
        <Tarjeta valor={panel.consultas.enProceso} etiqueta="Consultas en proceso" />
        <Tarjeta valor={panel.consultas.resueltas} etiqueta="Consultas resueltas" />
      </div>

      <h3 style={{ marginTop: '1.5rem' }}>Reportes de contenido</h3>
      <div className="cards panel-stats">
        <Tarjeta valor={panel.reportes.pendientes} etiqueta="Reportes pendientes" />
        <Tarjeta valor={panel.reportes.revisados} etiqueta="Reportes revisados" />
        <Tarjeta valor={panel.reportes.desestimados} etiqueta="Reportes desestimados" />
      </div>

      {panel.alcance === 'completo' && (
        <>
          <h3 style={{ marginTop: '1.5rem' }}>Pagos de contacto</h3>
          <div className="cards panel-stats">
            <Tarjeta valor={panel.pagos.pendientesDeConfirmar} etiqueta="Pagos por confirmar" />
            <Tarjeta valor={panel.pagos.confirmados} etiqueta="Pagos confirmados" />
            <Tarjeta valor={panel.pagos.rechazados} etiqueta="Pagos rechazados" />
          </div>

          <h3 style={{ marginTop: '1.5rem' }}>Planes y desbloqueos vigentes</h3>
          <div className="cards panel-stats">
            <Tarjeta valor={panel.accesos.planesActivos} etiqueta="Planes activos" />
            <Tarjeta valor={panel.accesos.desbloqueosVigentes} etiqueta="Desbloqueos vigentes" />
          </div>

          <h3 style={{ marginTop: '1.5rem' }}>Publicar producto y comisión</h3>
          <div className="cards panel-stats">
            <Tarjeta valor={panel.comision.productosPublicados} etiqueta="Productos publicados" />
            <Tarjeta valor={panel.comision.productoresQueAceptaron} etiqueta={`Productores que aceptaron el ${panel.comision.porcentaje}%`} />
            <Tarjeta valor="Sin datos" etiqueta="Comisión acumulada" nota="Aún no se registran ventas en la plataforma." />
          </div>
        </>
      )}
    </section>
  );
}

export default PanelAdminPage;
