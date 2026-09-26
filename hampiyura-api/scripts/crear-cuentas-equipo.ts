// Crea las 12 cuentas del equipo (correos en docs/usuarios-equipo.md) con contraseñas ALEATORIAS. Ejecutar una vez por base de datos:
//   cd hampiyura-api && npx tsx scripts/crear-cuentas-equipo.ts   (escribe las claves SOLO en credenciales-equipo-<fecha>.txt, ignorado por git; no se imprimen)
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { randomUUID, randomInt } from 'crypto';
import { writeFileSync } from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const CUENTAS: { nombre: string; correo: string; rol: string }[] = [
  { nombre: 'Angel', correo: 'angel@hampiyura.local', rol: 'Administrador' },
  { nombre: 'Junior', correo: 'junior@hampiyura.local', rol: 'Administrador' },
  { nombre: 'Mariela', correo: 'mariela@hampiyura.local', rol: 'Administrador' },
  { nombre: 'Norberto', correo: 'norberto@hampiyura.local', rol: 'Administrador' },
  { nombre: 'Especialista Salud 1', correo: 'especialista.salud1@hampiyura.local', rol: 'EspecialistaSalud' },
  { nombre: 'Especialista Salud 2', correo: 'especialista.salud2@hampiyura.local', rol: 'EspecialistaSalud' },
  { nombre: 'Especialista Agronomía 1', correo: 'especialista.agronomia1@hampiyura.local', rol: 'EspecialistaAgronomo' },
  { nombre: 'Especialista Agronomía 2', correo: 'especialista.agronomia2@hampiyura.local', rol: 'EspecialistaAgronomo' },
  { nombre: 'Usuario 1', correo: 'usuario1@hampiyura.local', rol: 'UsuarioRegistrado' },
  { nombre: 'Usuario 2', correo: 'usuario2@hampiyura.local', rol: 'UsuarioRegistrado' },
  { nombre: 'Usuario 3', correo: 'usuario3@hampiyura.local', rol: 'UsuarioRegistrado' },
  { nombre: 'Usuario 4', correo: 'usuario4@hampiyura.local', rol: 'UsuarioRegistrado' },
];

// 18 caracteres sin ambiguos (sin 0/O/1/l/I), con mayúscula, minúscula, número y símbolo garantizados.
function contraseña(): string {
  const may = 'ABCDEFGHJKLMNPQRSTUVWXYZ', min = 'abcdefghijkmnopqrstuvwxyz', num = '23456789', sim = '#$%&*+-=?@';
  const todos = may + min + num + sim;
  const pick = (s: string) => s[randomInt(s.length)];
  const chars = [pick(may), pick(min), pick(num), pick(sim)];
  while (chars.length < 18) chars.push(pick(todos));
  for (let i = chars.length - 1; i > 0; i--) { const j = randomInt(i + 1); [chars[i], chars[j]] = [chars[j], chars[i]]; }
  return chars.join('');
}

(async () => {
  if ((await prisma.usuario.count()) > 0) throw new Error('Ya hay usuarios en la base: este script es solo para una base recién limpiada.');
  const lineas: string[] = ['CREDENCIALES DEL EQUIPO HAMPIYURA -- pásalas por un canal privado y borra este archivo después.', ''];
  for (const c of CUENTAS) {
    const clave = contraseña();
    await prisma.usuario.create({ data: { id: randomUUID(), nombre: c.nombre, correo: c.correo, contraseñaHash: await bcrypt.hash(clave, 10), rol: c.rol as any, estado: 'Activo', idioma: 'es', nivelConocimiento: 'Pendiente', region: 'Pendiente' } });
    lineas.push(`${c.rol.padEnd(22)} ${c.nombre.padEnd(26)} ${c.correo.padEnd(42)} ${clave}`);
  }
  const archivo = path.resolve(__dirname, '..', '..', `credenciales-equipo-${new Date().toISOString().slice(0, 10)}.txt`);
  writeFileSync(archivo, lineas.join('\n') + '\n', { mode: 0o600 });
  console.log(`Creadas ${CUENTAS.length} cuentas. Credenciales guardadas en: ${archivo}`);
})().catch((e) => { console.error(e.message); process.exit(1); }).finally(() => prisma.$disconnect());
