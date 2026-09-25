// Emblema de HampiYura (recorte circular del logo completo, public/img/logo-emblema.png). Va sobre un
// círculo crema porque el logo es claro por dentro y las franjas de marca (header/footer) son oscuras
// en ambos temas. Decorativo: el nombre "HampiYura" siempre va escrito al lado.
function Logo({ size = 36 }: { size?: number }) {
  return (
    <span className="logo-emblema" style={{ width: size, height: size }} aria-hidden="true">
      <img src="/img/logo-emblema.png" alt="" width={size} height={size} decoding="async" />
    </span>
  );
}

export default Logo;
