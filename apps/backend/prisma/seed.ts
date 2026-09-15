import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

async function main(): Promise<void> {
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

  console.log(`Semilla aplicada: ${planesSemilla.length} planes`);
}

main()
  .catch((error: unknown) => {
    console.error('Error en semilla de planes:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
