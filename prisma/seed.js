// Seeds (or updates) an agent account. Plain CommonJS so it runs both in dev
// (`npm run db:seed`) and inside the production container:
//   docker compose exec app node prisma/seed.js
// Configure via env: SEED_AGENT_EMAIL, SEED_AGENT_PASSWORD, SEED_AGENT_NAME.
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.SEED_AGENT_EMAIL || "agent@k2binsurance.com")
    .trim()
    .toLowerCase();
  const password = process.env.SEED_AGENT_PASSWORD || "k2b2026-change-me";
  const name = process.env.SEED_AGENT_NAME || "K2B Agent";

  const passwordHash = await bcrypt.hash(password, 10);

  const agent = await prisma.agent.upsert({
    where: { email },
    update: { name, passwordHash },
    create: { email, name, passwordHash },
  });

  console.log(`Seeded agent: ${agent.email}`);
  if (!process.env.SEED_AGENT_PASSWORD) {
    console.log(
      "⚠️  Using the default password 'k2b2026-change-me'. Set SEED_AGENT_PASSWORD before a real deploy.",
    );
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
