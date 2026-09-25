import { useEffect, useState } from 'react';
import { obtenerPanel, type PanelAdmin } from '../api/admin.api';

function PanelAdminPage() {
  const [panel, setPanel] = useState<PanelAdmin | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    obtenerPanel().then(setPanel).catch(() => setError('No se pudo cargar el panel de administración.'));
  }, []);

  if (error) return <p>{error}</p>;
  if (!panel) return <p>Cargando panel…</p>;

  return (
    <section className="gestion-panel">
      <h2>Panel de administración (M-13)</h2>
      <div className="cards">
        <article><strong>{panel.validacionesPendientes}</strong><span>Validaciones pendientes</span></article>
        <article><strong>{panel.usuariosRegistrados}</strong><span>Usuarios registrados</span></article>
        <article><strong>{panel.usuariosActivos}</strong><span>Usuarios activos</span></article>
        <article><strong>{panel.plantasPublicadas}</strong><span>Plantas publicadas</span></article>
        <article><strong>{panel.publicacionesRealizadas}</strong><span>Publicaciones realizadas</span></article>
      </div>
      <h3 style={{ marginTop: '1.5rem' }}>Reportes de contenido</h3>
      <div className="cards">
        <article><strong>{panel.reportes.pendientes}</strong><span>Reportes pendientes</span></article>
        <article><strong>{panel.reportes.revisados}</strong><span>Reportes revisados</span></article>
        <article><strong>{panel.reportes.desestimados}</strong><span>Reportes desestimados</span></article>
      </div>
    </section>
  );
}

export default PanelAdminPage;
