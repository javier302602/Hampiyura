import { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'onBrand' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
}

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  onBrand: 'btn-on-brand',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
};
const SIZE_CLASS: Record<ButtonSize, string> = { sm: 'btn-sm', md: '', lg: 'btn-lg' };

// Único componente de botón de la app -- reemplaza los <button> sin clase repartidos por ~20
// archivos (ver auditoría) y el hecho de que .formulario button pintaba TODO botón del mismo color
// de acento sin distinguir primaria/secundaria/terciaria.
function Button({ variant = 'secondary', size = 'md', iconLeft, iconRight, loading, fullWidth, disabled, className, style, children, ...rest }: Props) {
  const clases = ['btn', VARIANT_CLASS[variant], SIZE_CLASS[size], className].filter(Boolean).join(' ');
  return (
    <button
      className={clases}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      style={fullWidth ? { width: '100%', ...style } : style}
      {...rest}
    >
      {loading ? <span className="btn-spinner" aria-hidden="true" /> : iconLeft}
      {children}
      {!loading && iconRight}
    </button>
  );
}

export default Button;
