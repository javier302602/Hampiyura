// RN-06: la prioridad Alta tiene que notarse de un vistazo -- mismo peso visual que las
// advertencias del resto del sistema, nunca un badge discreto más.
function IndicadorPrioridad({ prioridad }: { prioridad: 'Normal' | 'Alta' }) {
  if (prioridad !== 'Alta') return <span className="badge badge-estado">Prioridad normal</span>;
  return <p className="advertencia-no-verificado" style={{ margin: '.4em 0' }}>⚠ PRIORIDAD ALTA — requiere atención urgente</p>;
}

export default IndicadorPrioridad;
