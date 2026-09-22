interface Props {
  label?: string;
  cards?: number;
}

// Skeleton de tarjetas -- reemplaza el <p>Cargando…</p> plano que hace que el contenido "salte" de
// golpe cuando llega la respuesta. `cards` renderiza placeholders del tamaño de PlantCard/feature
// card; sin `cards`, renderiza solo el spinner + texto (para bloques que no son grillas).
function LoadingState({ label = 'Cargando…', cards }: Props) {
  if (cards) {
    return (
      <div className="card-grid" aria-busy="true" aria-label={label}>
        {Array.from({ length: cards }).map((_, i) => (
          <div className="skeleton-card" key={i}>
            <div className="skeleton-media skeleton-shimmer" />
            <div className="skeleton-line skeleton-shimmer" />
            <div className="skeleton-line skeleton-line-sm skeleton-shimmer" />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="state-block" aria-busy="true">
      <span className="loading-spinner" aria-hidden="true" />
      <p className="state-block-desc">{label}</p>
    </div>
  );
}

export default LoadingState;
