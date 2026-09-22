interface Props {
  nombre: string;
}

function inicial(nombre: string): string {
  return nombre.trim().charAt(0).toUpperCase() || '?';
}

function Avatar({ nombre }: Props) {
  return <span className="avatar" aria-hidden="true">{inicial(nombre)}</span>;
}

export default Avatar;
