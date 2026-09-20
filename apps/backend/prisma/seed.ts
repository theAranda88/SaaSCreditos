import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/** Contraseña compartida de usuarios de prueba (solo desarrollo local). */
export const CONTRASENA_USUARIOS_PRUEBA = 'ClaveSegura123';

/** Correo del administrador de plataforma sembrado (solo desarrollo local). */
export const CORREO_ADMIN_PLATAFORMA = 'admin@plataforma.local';

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

function fechaHoyUtc(): Date {
  const ahora = new Date();
  return new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate()));
}

function sumarMesesUtc(fecha: Date, meses: number): Date {
  return new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth() + meses, fecha.getUTCDate()));
}

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
): Promise<string | null> {
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
    return existente.negocioId;
  }

  const negocio = await prisma.negocio.create({
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

  return negocio.id;
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

async function sembrarSuscripcion(negocioId: string, planId: string): Promise<void> {
  const hoy = fechaHoyUtc();
  await prisma.suscripcion.upsert({
    where: { negocioId },
    update: {},
    create: {
      negocioId,
      planId,
      estado: 'activa',
      fechaInicio: hoy,
      fechaRenovacion: sumarMesesUtc(hoy, 1),
    },
  });
}

async function sembrarAdminPlataforma(hashContrasena: string): Promise<void> {
  await prisma.usuario.upsert({
    where: { correo: CORREO_ADMIN_PLATAFORMA },
    update: {
      nombre: 'Admin Plataforma',
      hashContrasena,
      rol: 'admin_plataforma',
      estado: 'activo',
      negocioId: null,
    },
    create: {
      nombre: 'Admin Plataforma',
      correo: CORREO_ADMIN_PLATAFORMA,
      hashContrasena,
      rol: 'admin_plataforma',
    },
  });
}

async function sembrarUsuariosPrueba(hashContrasena: string): Promise<{ usuarios: number; negocios: string[] }> {
  let usuariosCreados = 0;
  const negocioIds: string[] = [];

  for (const negocio of negociosPrueba) {
    const negocioId = await sembrarNegocioConPropietario(
      negocio.nombreComercial,
      negocio.propietario,
      hashContrasena,
    );
    usuariosCreados += 1;

    if (negocioId) {
      negocioIds.push(negocioId);
    }

    if ('cobrador' in negocio && negocio.cobrador) {
      await sembrarCobrador(negocio.nombreComercial, negocio.cobrador, hashContrasena);
      usuariosCreados += 1;
    }
  }

  await sembrarAdminPlataforma(hashContrasena);
  usuariosCreados += 1;

  return { usuarios: usuariosCreados, negocios: negocioIds };
}

async function main(): Promise<void> {
  const planes = await sembrarPlanes();
  const planInicial = await prisma.plan.findUnique({ where: { codigo: 'emprendedor' } });

  if (!planInicial) {
    throw new Error('No se encontró el plan emprendedor tras la semilla');
  }

  const hashContrasena = await bcrypt.hash(CONTRASENA_USUARIOS_PRUEBA, RONDAS_BCRYPT);
  const { usuarios, negocios } = await sembrarUsuariosPrueba(hashContrasena);

  for (const negocioId of negocios) {
    await sembrarSuscripcion(negocioId, planInicial.id);
  }

  console.log(
    `Semilla aplicada: ${planes} planes, ${usuarios} usuarios de prueba, ${negocios.length} suscripciones`,
  );
}

main()
  .catch((error: unknown) => {
    console.error('Error en semilla:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
