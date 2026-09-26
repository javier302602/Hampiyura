import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Lock } from 'lucide-react';
import { obtenerReporteBioeconomia, type FilaConteo, type ReporteBioeconomia } from '../api/extras.api';
import { RUTAS_M15 } from '../api/planes.api';
import RequireRole from '../../../shared/auth/RequireRole';
import Button from '../../../shared/ui/Button';
import SectionHeader from '../../../shared/ui/SectionHeader';
import LoadingState from '../../../shared/ui/LoadingState';
import ErrorState from '../../../shared/ui/ErrorState';
import EmptyState from '../../../shared/ui/EmptyState';

function Tabla({ titulo, filas, umbral, pie }: { titulo: string; filas: FilaConteo[]; umbral: number; pie?: string }) {
  const maximo = Math.max(1, ...filas.map((f) => f.cantidad ?? 0));
  return (
    <section className="reporte-bloque" aria-label={titulo}>
      <h3>{titulo}</h3>
      {filas.length === 0 ? <p className="comentario-meta">Todavía no hay datos.</p> : (
        <table className="reporte-tabla">
          <thead><tr><th scope="col">Categoría</th><th scope="col">Cantidad</th></tr></thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.etiqueta}>
                <th scope="row">{f.etiqueta}</th>
                <td>{f.oculto ? <span className="comentario-meta">menos de {umbral}</span> : (<><span className="reporte-barra" aria-hidden="true" style={{ width: `${Math.max(4, ((f.cantidad ?? 0) / maximo) * 100)}%` }} /><strong>{f.cantidad}</strong></>)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {pie && <p className="comentario-meta">{pie}</p>}
    </section>
  );
}

function aCsv(r: ReporteBioeconomia): string {
  const filas: string[][] = [['seccion', 'etiqueta', 'cantidad']];
  const totales: [string, number][] = [['productores activos', r.totales.productoresActivos], ['productores contactables', r.totales.productoresContactables], ['plantas en el catálogo', r.totales.plantasEnCatalogo], ['plantas con ficha de cultivo validada', r.totales.plantasConFichaDeCultivoValidada], ['fichas de cultivo validadas', r.totales.fichasDeCultivoValidadas], ['productos publicados', r.totales.productosPublicados]];
  totales.forEach(([e, c]) => filas.push(['Totales', e, String(c)]));
  const bloques: [string, FilaConteo[]][] = [['Productores por zona', r.productoresPorZona], ['Productos por categoría de uso', r.productosPorCategoria], ['Productos por tipo de productor', r.productosPorTipoProductor], ['Plantas más ofrecidas', r.plantasMasOfrecidas], ['Plantas más buscadas', r.plantasMasBuscadas]];
  bloques.forEach(([s, fs]) => fs.forEach((f) => filas.push([s, f.etiqueta, f.oculto ? `menos de ${r.umbralMinimo}` : String(f.cantidad)])));
  return filas.map((f) => f.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\r\n');
}

// Reportes agregados de la bioeconomía regional (plan Institucional). Solo conteos por zona, categoría y planta: nunca datos personales.
function ReportesPage() {
  const navigate = useNavigate();
  const [reporte, setReporte] = useState<ReporteBioeconomia | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { obtenerReporteBioeconomia().then(setReporte).catch((e) => setError(e instanceof Error ? e.message : 'No se pudo cargar el reporte.')); }, []);

  function descargar() {
    if (!reporte) return;
    const url = URL.createObjectURL(new Blob(['﻿' + aCsv(reporte)], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = `bioeconomia-regional-${reporte.generadoEn.slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url);
  }

  return (
    <section>
      <SectionHeader eyebrow="Plan Institucional" title="Bioeconomía regional" description="Datos agregados de productores, productos y plantas de la plataforma. Sin datos personales de productores."
        action={reporte ? <Button variant="secondary" iconLeft={<Download size={15} aria-hidden="true" />} onClick={descargar}>Descargar CSV</Button> : undefined} />
      <RequireRole permitido={() => true}>
        {error && (
          <EmptyState icon={<Lock size={22} aria-hidden="true" />} title="Reporte bloqueado" description={error}
            action={<Button variant="primary" onClick={() => navigate(RUTAS_M15.planes)}>Ver planes</Button>} />
        )}
        {!reporte && !error && <LoadingState label="Generando el reporte" />}
        {reporte && (
          <>
            <dl className="reporte-totales">
              <div><dt>Productores activos</dt><dd>{reporte.totales.productoresActivos}</dd></div>
              <div><dt>Productores contactables</dt><dd>{reporte.totales.productoresContactables}</dd></div>
              <div><dt>Plantas en el catálogo</dt><dd>{reporte.totales.plantasEnCatalogo}</dd></div>
              <div><dt>Plantas con ficha de cultivo validada</dt><dd>{reporte.totales.plantasConFichaDeCultivoValidada}</dd></div>
              <div><dt>Fichas de cultivo validadas</dt><dd>{reporte.totales.fichasDeCultivoValidadas}</dd></div>
              <div><dt>Productos publicados</dt><dd>{reporte.totales.productosPublicados}</dd></div>
            </dl>
            <div className="reporte-grid">
              <Tabla titulo="Productores por zona" filas={reporte.productoresPorZona} umbral={reporte.umbralMinimo} pie={`Las zonas con menos de ${reporte.umbralMinimo} productores no muestran la cifra, para proteger su identidad.`} />
              <Tabla titulo="Productos por categoría de uso" filas={reporte.productosPorCategoria} umbral={reporte.umbralMinimo} />
              <Tabla titulo="Productos por tipo de productor" filas={reporte.productosPorTipoProductor} umbral={reporte.umbralMinimo} />
              <Tabla titulo="Plantas más ofrecidas" filas={reporte.plantasMasOfrecidas} umbral={reporte.umbralMinimo} pie="Cantidad de productos aprobados que usan la planta." />
              <Tabla titulo="Plantas más buscadas" filas={reporte.plantasMasBuscadas} umbral={reporte.umbralMinimo} pie={`Búsquedas por nombre de los últimos ${reporte.diasBusquedas} días, sin registrar quién buscó.`} />
            </div>
            <ul className="comentario-meta reporte-notas">{reporte.notas.map((n) => <li key={n}>{n}</li>)}</ul>
            <p className="comentario-meta">Generado el {new Date(reporte.generadoEn).toLocaleString('es-PE')}.</p>
          </>
        )}
      </RequireRole>
    </section>
  );
}

export default ReportesPage;
