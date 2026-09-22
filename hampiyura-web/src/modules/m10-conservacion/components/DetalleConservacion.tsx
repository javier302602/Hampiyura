import type { EstadoConservacionVisible } from '../api/conservacion.api';

// La fuente citada pesa aquí igual que el aviso legal de M-05 (.aviso-legal) -- nunca la cita
// discreta en itálica (.fuente-cita) que se usa en otros módulos para citas secundarias.
function DetalleConservacion({ conservacion }: { conservacion: EstadoConservacionVisible & { disponible: true } }) {
  return (
    <div>
      <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
        <span className="badge badge-estado">Categoría: {conservacion.categoria}</span>
        <span className="badge badge-estado">Nivel de riesgo: {conservacion.nivelRiesgo}</span>
      </div>
      <h4>Zona</h4>
      <p>{conservacion.zona}</p>
      <h4>Amenazas</h4>
      <p>{conservacion.amenazas}</p>
      <h4>Disponibilidad / temporada</h4>
      <p>{conservacion.disponibilidadTemporada}</p>
      <h4>Recomendaciones de conservación</h4>
      <p>{conservacion.recomendacionesConservacion}</p>
      <h4>Métodos de propagación</h4>
      <p>{conservacion.metodosPropagacion}</p>
      <h4>Alternativas de cultivo</h4>
      <p>{conservacion.alternativasCultivo}</p>
      <p className="aviso-legal">📖 Fuente oficial: {conservacion.fuenteOficial.valor}</p>
    </div>
  );
}

export default DetalleConservacion;
