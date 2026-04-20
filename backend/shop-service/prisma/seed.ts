import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Generando 20,000 tiendas...');
  const data = Array.from({ length: 20000 }).map((_, i) => ({
    name: `Tienda ${i + 1}`,
    owner_id: Math.floor(Math.random() * 100) + 1, 
  }));

  await prisma.shop.createMany({
    data: data,
    skipDuplicates: true,
  });

  console.log('Seeding completado con éxito.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
