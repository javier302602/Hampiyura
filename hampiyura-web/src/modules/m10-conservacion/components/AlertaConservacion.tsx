import type { EstadoConservacionVisible } from '../api/conservacion.api';

// RF-269: el aviso de riesgo debe pesar visualmente igual que las advertencias del resto del
// sistema (nunca un texto discreto solo por ser "informativo"). Cuando no hay ningún registro
// validado, se muestra el texto LITERAL que devuelve la API (RF-267), sin resumir ni omitir.
function AlertaConservacion({ conservacion }: { conservacion: EstadoConservacionVisible }) {
  if (!conservacion.disponible) {
    return <p className="nota-cientifico">ℹ {conservacion.mensaje}</p>;
  }
  if (conservacion.alertaVisible) {
    return (
      <p className="advertencia-no-verificado">
        ⚠ Especie en riesgo de conservación — nivel: <strong>{conservacion.nivelRiesgo}</strong>. {conservacion.amenazas}
      </p>
    );
  }
  return null;
}

export default AlertaConservacion;
