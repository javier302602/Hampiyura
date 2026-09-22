function Indicador({ activo, etiqueta }: { activo: boolean; etiqueta: string }) {
  return <span className={`indicador-etiqueta ${activo ? 'indicador-activo' : 'indicador-inactivo'}`}>{activo ? '✔' : '○'} {etiqueta}</span>;
}

// Las 3 etiquetas son independientes (RF-272): ninguna implica ni depende de las otras dos.
function IndicadoresProducto({ revisadoPorEquipo, validadoDocumental, certificado }: { revisadoPorEquipo: boolean; validadoDocumental: boolean; certificado: boolean }) {
  return (
    <div className="indicadores-producto">
      <Indicador activo={revisadoPorEquipo} etiqueta="Revisado por el equipo" />
      <Indicador activo={validadoDocumental} etiqueta="Validado documentalmente" />
      <Indicador activo={certificado} etiqueta="Certificado por entidad competente" />
    </div>
  );
}

export default IndicadoresProducto;
