import { RegistrarUsuarioUseCase } from '../../src/application/m01-cuentas/cuentas.use-cases';

// El correo no debe distinguir mayúsculas: "Junior@hampiyura.local" (la J que autocorrige el teléfono) tiene que entrar igual que "junior@...".
describe('cuentas · correo sin distinguir mayúsculas', () => {
  test('el registro guarda el correo en minúsculas y sin espacios, y busca duplicados con el correo tal como llegó', async () => {
    const guardados: any[] = []; const buscados: string[] = [];
    const repo: any = { buscarPorCorreo: async (c: string) => { buscados.push(c); return null; }, guardar: async (u: any) => { guardados.push(u); } };
    const uc = new RegistrarUsuarioUseCase(repo, { guardar: async () => {} } as any, { enviarActivacion: async () => {} } as any);
    await uc.ejecutar({ nombre: 'Junior', correo: '  Junior@HampiYura.local ', contraseña: 'ClaveSegura123', contraseñaConfirmacion: 'ClaveSegura123' });
    expect(guardados[0].props.correo).toBe('junior@hampiyura.local');
    expect(buscados).toHaveLength(1); // la comparación case-insensitive la hace el repositorio (findFirst con mode insensitive)
  });
});
