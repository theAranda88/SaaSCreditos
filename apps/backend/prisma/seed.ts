import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/** Contraseña compartida de usuarios de prueba (solo desarrollo local). */
export const CONTRASENA_USUARIOS_PRUEBA = 'ClaveSegura123';

const RONDAS_BCRYPT = 12;

const planesSemilla = [
  {
    codigo: 'emprendedor',
    nombre: 'Emprendedor',
    limiteCobradores: 3,
    precioImplementacion: '1250000.00',
    precioMensual: '250000.00',
    caracteristicas: {
      descripcion: 'Plan inicial para prestamistas pequeños',
    },
  },
  {
    codigo: 'profesional',
    nombre: 'Profesional',
    limiteCobradores: 10,
    precioImplementacion: '2500000.00',
    precioMensual: '425000.00',
    caracteristicas: {
      descripcion: 'Plan para equipos de cobro medianos',
    },
  },
  {
    codigo: 'empresarial',
    nombre: 'Empresarial',
    limiteCobradores: 15,
    precioImplementacion: '3500000.00',
    precioMensual: '750000.00',
    caracteristicas: {
      descripcion: 'Plan para operaciones de mayor escala',
    },
  },
] as const;

const negociosPrueba = [
  {
    nombreComercial: 'Préstamos Alfa (prueba)',
    propietario: {
      nombre: 'Ana Propietaria',
      correo: 'ana@prueba-alfa.local',
    },
    cobrador: {
      nombre: 'Carlos Cobrador',
      correo: 'cobrador@prueba-alfa.local',
    },
  },
  {
    nombreComercial: 'Créditos Beta (prueba)',
    propietario: {
      nombre: 'Boris Propietario',
      correo: 'boris@prueba-beta.local',
    },
  },
] as const;

async function sembrarPlanes(): Promise<number> {
  for (const plan of planesSemilla) {
    await prisma.plan.upsert({
      where: { codigo: plan.codigo },
      update: {
        nombre: plan.nombre,
        limiteCobradores: plan.limiteCobradores,
        precioImplementacion: plan.precioImplementacion,
        precioMensual: plan.precioMensual,
        caracteristicas: plan.caracteristicas,
      },
      create: plan,
    });
  }

  return planesSemilla.length;
}

async function sembrarNegocioConPropietario(
  nombreComercial: string,
  propietario: { nombre: string; correo: string },
  hashContrasena: string,
): Promise<void> {
  const correo = propietario.correo.toLowerCase();
  const existente = await prisma.usuario.findUnique({ where: { correo } });

  if (existente?.negocioId) {
    await prisma.usuario.update({
      where: { correo },
      data: {
        nombre: propietario.nombre,
        hashContrasena,
        rol: 'propietario',
        estado: 'activo',
      },
    });
    await prisma.negocio.update({
      where: { id: existente.negocioId },
      data: { nombreComercial },
    });
    return;
  }

  await prisma.negocio.create({
    data: {
      nombreComercial,
      usuarios: {
        create: {
          nombre: propietario.nombre,
          correo,
          hashContrasena,
          rol: 'propietario',
        },
      },
    },
  });
}

async function sembrarCobrador(
  nombreComercial: string,
  cobrador: { nombre: string; correo: string },
  hashContrasena: string,
): Promise<void> {
  const negocio = await prisma.negocio.findFirst({
    where: { nombreComercial },
  });

  if (!negocio) {
    return;
  }

  const correo = cobrador.correo.toLowerCase();

  await prisma.usuario.upsert({
    where: { correo },
    update: {
      nombre: cobrador.nombre,
      hashContrasena,
      rol: 'cobrador',
      estado: 'activo',
      negocioId: negocio.id,
    },
    create: {
      negocioId: negocio.id,
      nombre: cobrador.nombre,
      correo,
      hashContrasena,
      rol: 'cobrador',
    },
  });
}

async function sembrarUsuariosPrueba(hashContrasena: string): Promise<number> {
  let usuariosCreados = 0;

  for (const negocio of negociosPrueba) {
    await sembrarNegocioConPropietario(
      negocio.nombreComercial,
      negocio.propietario,
      hashContrasena,
    );
    usuariosCreados += 1;

    if ('cobrador' in negocio && negocio.cobrador) {
      await sembrarCobrador(negocio.nombreComercial, negocio.cobrador, hashContrasena);
      usuariosCreados += 1;
    }
  }

  return usuariosCreados;
}

async function main(): Promise<void> {
  const planes = await sembrarPlanes();
  const hashContrasena = await bcrypt.hash(CONTRASENA_USUARIOS_PRUEBA, RONDAS_BCRYPT);
  const usuarios = await sembrarUsuariosPrueba(hashContrasena);

  console.log(`Semilla aplicada: ${planes} planes, ${usuarios} usuarios de prueba`);
}

main()
  .catch((error: unknown) => {
    console.error('Error en semilla:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
