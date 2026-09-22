import { Navigate, Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import PlantaListPage from './modules/m02-catalogo-plantas/pages/PlantaListPage';
import PlantaDetailPage from './modules/m02-catalogo-plantas/pages/PlantaDetailPage';
import UsosPage from './modules/m04-usos-partes/pages/UsosPage';
import PublicacionesFeedPage from './modules/m06-publicaciones/pages/PublicacionesFeedPage';
import PublicacionDetailPage from './modules/m06-publicaciones/pages/PublicacionDetailPage';
import ProductosDirectorioPage from './modules/m11-productos/pages/ProductosDirectorioPage';
import ProductoDetailPage from './modules/m11-productos/pages/ProductoDetailPage';
import PublicarProductoPage from './modules/m11-productos/pages/PublicarProductoPage';
import ResultadosBusquedaPage from './modules/m12-busqueda-recomendaciones/pages/ResultadosBusquedaPage';
import MapaCultivoPage from './modules/m03-cultivo/pages/MapaCultivoPage';
import NotificacionesPage from './modules/m14-notificaciones/pages/NotificacionesPage';
import LoginPage from './modules/m01-cuentas/pages/LoginPage';
import RegistroPage from './modules/m01-cuentas/pages/RegistroPage';
import ActivarCuentaPage from './modules/m01-cuentas/pages/ActivarCuentaPage';
import RecuperarContrasenaPage from './modules/m01-cuentas/pages/RecuperarContrasenaPage';
import RestablecerContrasenaPage from './modules/m01-cuentas/pages/RestablecerContrasenaPage';
import PerfilPage from './modules/m01-cuentas/pages/PerfilPage';
import EnviarConsultaPage from './modules/m08-consultas/pages/EnviarConsultaPage';
import MisConsultasPage from './modules/m08-consultas/pages/MisConsultasPage';
import ConsultaDetailPage from './modules/m08-consultas/pages/ConsultaDetailPage';
import BandejaConsultasPage from './modules/m08-consultas/pages/BandejaConsultasPage';
import BandejaValidacionPage from './modules/m09-validacion-moderacion/pages/BandejaValidacionPage';
import PanelAdminPage from './modules/m13-analitica-estadisticas/pages/PanelAdminPage';
import Layout from './shared/layout/Layout';
import RequireRole from './shared/auth/RequireRole';
import { esAdministrador, esValidador } from './shared/auth/session';
import type { FiltrosBusqueda } from './modules/m12-busqueda-recomendaciones/api/busqueda.api';

const RUTAS = {
  catalogo: '/m02-catalogo-plantas', mapa: '/m03-cultivo/mapa', usos: '/m04-usos-partes',
  publicaciones: '/m06-publicaciones', consultas: '/m08-consultas', validacion: '/m09-validacion-moderacion/bandeja',
  productos: '/m11-productos-emprendimientos', busqueda: '/m12-busqueda-recomendaciones/resultados',
  admin: '/m13-analitica-estadisticas/panel', notificaciones: '/m14-notificaciones', cuentas: '/m01-cuentas',
} as const;

function RutaPlanta() {
  const { plantaId = '' } = useParams();
  const navigate = useNavigate();
  return <PlantaDetailPage plantaId={plantaId} onVolver={() => navigate(RUTAS.catalogo)} />;
}
function RutaPublicacion() {
  const { publicacionId = '' } = useParams();
  const navigate = useNavigate();
  return <PublicacionDetailPage publicacionId={publicacionId} onVolver={() => navigate(RUTAS.publicaciones)} onEliminada={() => navigate(RUTAS.publicaciones)} />;
}
function RutaProducto() {
  const { productoId = '' } = useParams();
  const navigate = useNavigate();
  return <ProductoDetailPage productoId={productoId} onVolver={() => navigate(RUTAS.productos)} />;
}
function RutaConsulta() {
  const { consultaId = '' } = useParams();
  const navigate = useNavigate();
  return <ConsultaDetailPage consultaId={consultaId} onVolver={() => navigate(`${RUTAS.consultas}/mis-consultas`)} />;
}
function RutaBusqueda() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const filtros: FiltrosBusqueda = { q: params.get('q') ?? undefined, enfermedad: params.get('enfermedad') ?? undefined, categoria: params.get('categoria') ?? undefined };
  return <ResultadosBusquedaPage filtros={filtros} onSeleccionarPlanta={(id) => navigate(`${RUTAS.catalogo}/${encodeURIComponent(id)}`)} onVolver={() => navigate(RUTAS.catalogo)} />;
}

function App() {
  const navigate = useNavigate();
  function buscar(filtros: FiltrosBusqueda) {
    const params = new URLSearchParams();
    Object.entries(filtros).forEach(([clave, valor]) => { if (valor?.trim()) params.set(clave, valor.trim()); });
    navigate(`${RUTAS.busqueda}?${params.toString()}`);
  }

  return (
    <Layout
      onBuscar={buscar}
      onAbrirNotificaciones={() => navigate(RUTAS.notificaciones)}
      onIrALogin={() => navigate(`${RUTAS.cuentas}/login`)}
      onIrARegistro={() => navigate(`${RUTAS.cuentas}/registro`)}
      onIrAPerfil={() => navigate(`${RUTAS.cuentas}/perfil`)}
      onIrAMisConsultas={() => navigate(`${RUTAS.consultas}/mis-consultas`)}
      onIrAEnviarConsulta={() => navigate(`${RUTAS.consultas}/nueva`)}
      onIrAMapaCultivo={() => navigate(RUTAS.mapa)}
      onIrAUsos={() => navigate(RUTAS.usos)}
      onIrAPublicaciones={() => navigate(RUTAS.publicaciones)}
      onIrAProductos={() => navigate(RUTAS.productos)}
      onIrAPublicarProducto={() => navigate(`${RUTAS.productos}/nuevo`)}
      onIrABandejaValidacion={() => navigate(RUTAS.validacion)}
      onIrABandejaConsultas={() => navigate(`${RUTAS.consultas}/bandeja`)}
      onIrAPanelAdmin={() => navigate(RUTAS.admin)}
    >
      <Routes>
        <Route path="/" element={<Navigate to={RUTAS.catalogo} replace />} />
        <Route path={RUTAS.catalogo} element={<PlantaListPage onSeleccionar={(id) => navigate(`${RUTAS.catalogo}/${encodeURIComponent(id)}`)} />} />
        <Route path={`${RUTAS.catalogo}/:plantaId`} element={<RutaPlanta />} />
        <Route path={RUTAS.usos} element={<UsosPage />} />
        <Route path={RUTAS.mapa} element={<MapaCultivoPage onSeleccionarPlanta={(id) => navigate(`${RUTAS.catalogo}/${encodeURIComponent(id)}`)} />} />
        <Route path={RUTAS.publicaciones} element={<PublicacionesFeedPage onSeleccionar={(id) => navigate(`${RUTAS.publicaciones}/${encodeURIComponent(id)}`)} />} />
        <Route path={`${RUTAS.publicaciones}/:publicacionId`} element={<RutaPublicacion />} />
        <Route path={RUTAS.productos} element={<ProductosDirectorioPage onSeleccionar={(id) => navigate(`${RUTAS.productos}/${encodeURIComponent(id)}`)} />} />
        <Route path={`${RUTAS.productos}/nuevo`} element={<PublicarProductoPage onVolver={() => navigate(RUTAS.productos)} />} />
        <Route path={`${RUTAS.productos}/:productoId`} element={<RutaProducto />} />
        <Route path={RUTAS.busqueda} element={<RutaBusqueda />} />
        <Route path={RUTAS.notificaciones} element={<NotificacionesPage onVolver={() => navigate(RUTAS.catalogo)} onAbrirConsulta={(id) => navigate(`${RUTAS.consultas}/${encodeURIComponent(id)}`)} />} />
        <Route path={`${RUTAS.cuentas}/login`} element={<LoginPage onIngreso={() => navigate(RUTAS.catalogo)} onIrARegistro={() => navigate(`${RUTAS.cuentas}/registro`)} onIrARecuperar={() => navigate(`${RUTAS.cuentas}/recuperar`)} onIrAActivar={() => navigate(`${RUTAS.cuentas}/activar`)} />} />
        <Route path={`${RUTAS.cuentas}/registro`} element={<RegistroPage onIrALogin={() => navigate(`${RUTAS.cuentas}/login`)} />} />
        <Route path={`${RUTAS.cuentas}/activar`} element={<ActivarCuentaPage onActivada={() => navigate(`${RUTAS.cuentas}/login`)} />} />
        <Route path={`${RUTAS.cuentas}/recuperar`} element={<RecuperarContrasenaPage onIrARestablecer={() => navigate(`${RUTAS.cuentas}/restablecer`)} />} />
        <Route path={`${RUTAS.cuentas}/restablecer`} element={<RestablecerContrasenaPage onRestablecida={() => navigate(`${RUTAS.cuentas}/login`)} />} />
        <Route path={`${RUTAS.cuentas}/perfil`} element={<PerfilPage onVolver={() => navigate(RUTAS.catalogo)} />} />
        <Route path={`${RUTAS.consultas}/nueva`} element={<EnviarConsultaPage onVerMisConsultas={() => navigate(`${RUTAS.consultas}/mis-consultas`)} onVolver={() => navigate(RUTAS.catalogo)} />} />
        <Route path={`${RUTAS.consultas}/mis-consultas`} element={<section><h2>Mis consultas</h2><MisConsultasPage onSeleccionar={(id) => navigate(`${RUTAS.consultas}/${encodeURIComponent(id)}`)} /></section>} />
        <Route path={`${RUTAS.consultas}/bandeja`} element={<RequireRole permitido={esValidador}><BandejaConsultasPage onSeleccionar={(id) => navigate(`${RUTAS.consultas}/${encodeURIComponent(id)}`)} /></RequireRole>} />
        <Route path={`${RUTAS.consultas}/:consultaId`} element={<RutaConsulta />} />
        <Route path={RUTAS.validacion} element={<RequireRole permitido={esValidador}><BandejaValidacionPage /></RequireRole>} />
        <Route path={RUTAS.admin} element={<RequireRole permitido={esAdministrador}><PanelAdminPage /></RequireRole>} />
        <Route path="*" element={<Navigate to={RUTAS.catalogo} replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
