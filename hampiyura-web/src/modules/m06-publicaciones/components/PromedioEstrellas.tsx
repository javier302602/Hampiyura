function PromedioEstrellas({ promedio, total }: { promedio: number | null; total: number }) {
  if (promedio === null) return <span className="comentario-meta">Sin calificaciones todavía</span>;
  const llenas = Math.round(promedio);
  return (
    <span className="estrellas" style={{ fontSize: '1.1rem' }}>
      {[1, 2, 3, 4, 5].map((n) => <span key={n} style={{ color: n <= llenas ? '#e0a03a' : '#ccc' }}>★</span>)}
      <span className="comentario-meta" style={{ marginLeft: '.3em' }}>{promedio.toFixed(1)} ({total})</span>
    </span>
  );
}

export default PromedioEstrellas;
