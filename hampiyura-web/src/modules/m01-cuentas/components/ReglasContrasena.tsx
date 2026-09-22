// Refleja exactamente ContraseñaSegura (backend): mínimo 8 caracteres, con letras y números.
// Se muestra mientras el usuario escribe, no solo tras un envío fallido.
function ReglasContrasena({ contraseña }: { contraseña: string }) {
  const reglas = [
    { cumple: contraseña.length >= 8, texto: 'Al menos 8 caracteres' },
    { cumple: /[a-zA-Z]/.test(contraseña), texto: 'Al menos una letra' },
    { cumple: /[0-9]/.test(contraseña), texto: 'Al menos un número' },
  ];
  return (
    <ul style={{ margin: '.3em 0', paddingLeft: '1.2em', fontSize: '.9rem' }}>
      {reglas.map((r) => (
        <li key={r.texto} style={{ color: r.cumple ? '#1e7a42' : '#665' }}>
          {r.cumple ? '✔' : '○'} {r.texto}
        </li>
      ))}
    </ul>
  );
}

export function contraseñaEsSegura(contraseña: string): boolean {
  return contraseña.length >= 8 && /[a-zA-Z]/.test(contraseña) && /[0-9]/.test(contraseña);
}

export default ReglasContrasena;
