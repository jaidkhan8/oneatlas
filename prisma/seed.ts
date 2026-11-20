// OneAtlas database seed. Run with: npx prisma db seed
// Idempotent: safe to run multiple times (upserts by slug).
import { PrismaClient } from "@prisma/client";
import { labs, providers, benchmarks, models } from "./seed-data";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding OneAtlas...");

  for (const lab of labs) {
    await prisma.lab.upsert({
      where: { slug: lab.slug },
      update: lab,
      create: lab,
    });
  }
  console.log(`  labs: ${labs.length}`);

  for (const provider of providers) {
    await prisma.provider.upsert({
      where: { slug: provider.slug },
      update: provider,
      create: provider,
    });
  }
  console.log(`  providers: ${providers.length}`);

  for (const benchmark of benchmarks) {
    await prisma.benchmark.upsert({
      where: { slug: benchmark.slug },
      update: benchmark,
      create: benchmark,
    });
  }
  console.log(`  benchmarks: ${benchmarks.length}`);

  for (const m of models) {
    const lab = await prisma.lab.findUniqueOrThrow({ where: { slug: m.lab } });
    const model = await prisma.model.upsert({
      where: { slug: m.slug },
      update: {
        name: m.name,
        labId: lab.id,
        modelType: m.modelType,
        description: m.description,
        contextWindow: m.contextWindow,
        inputPricePer1M: m.inputPricePer1M,
        outputPricePer1M: m.outputPricePer1M,
        releaseDate: m.releaseDate ? new Date(m.releaseDate) : null,
        modalities: m.modalities,
        capabilities: m.capabilities,
        openWeights: m.openWeights,
        license: m.license,
        status: m.status,
        website: m.website,
      },
      create: {
        name: m.name,
        slug: m.slug,
        labId: lab.id,
        modelType: m.modelType,
        description: m.description,
        contextWindow: m.contextWindow,
        inputPricePer1M: m.inputPricePer1M,
        outputPricePer1M: m.outputPricePer1M,
        releaseDate: m.releaseDate ? new Date(m.releaseDate) : null,
        modalities: m.modalities,
        capabilities: m.capabilities,
        openWeights: m.openWeights,
        license: m.license,
        status: m.status,
        website: m.website,
      },
    });

    // Providers for this model (replace the set on re-seed).
    await prisma.modelProvider.deleteMany({ where: { modelId: model.id } });
    for (const providerSlug of m.providers) {
      const provider = await prisma.provider.findUniqueOrThrow({
        where: { slug: providerSlug },
      });
      await prisma.modelProvider.create({
        data: { modelId: model.id, providerId: provider.id },
      });
    }

    // Benchmark scores (replace the set on re-seed).
    await prisma.modelBenchmark.deleteMany({ where: { modelId: model.id } });
    for (const s of m.scores) {
      const benchmark = await prisma.benchmark.findUniqueOrThrow({
        where: { slug: s.benchmark },
      });
      await prisma.modelBenchmark.create({
        data: {
          modelId: model.id,
          benchmarkId: benchmark.id,
          score: s.score,
          source: s.source,
          verified: true,
        },
      });
    }
  }
  console.log(`  models: ${models.length}`);
  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
