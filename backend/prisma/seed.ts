import { PrismaClient } from "@prisma/client";
import { DEFAULT_CATEGORY_NAMES } from "../src/lib/default-categories";

const prisma = new PrismaClient();

async function main() {
  for (const name of DEFAULT_CATEGORY_NAMES) {
    const existing = await prisma.category.findFirst({
      where: { name, isDefault: true, ownerUserId: null },
    });

    if (!existing) {
      await prisma.category.create({
        data: { name, isDefault: true, ownerUserId: null },
      });
      console.log(`Categoria por defecto creada: ${name}`);
    }
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
