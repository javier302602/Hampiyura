import { EmailPort } from '../../../../domain/ports/out/email.port';
export class ConsoleEmailAdapter implements EmailPort {
  // En desarrollo el token queda visible para probar activación/recuperación sin consultar la BD.
  // En producción este adapter no sustituye a un proveedor de correo real y no debe filtrar tokens.
  async enviarActivacion(correo: string, token: string): Promise<void> {
    if (process.env.NODE_ENV !== 'production') console.log(`[email:activacion] Para ${correo} -> enlace: /cuentas/activar?token=${token}`);
  }
  async enviarRecuperacion(correo: string, token: string): Promise<void> {
    if (process.env.NODE_ENV !== 'production') console.log(`[email:recuperacion] Para ${correo} -> enlace (válido 15 min): /cuentas/restablecer?token=${token}`);
  }
}
