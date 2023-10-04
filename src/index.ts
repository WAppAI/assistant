import { prisma } from "./clients/prisma";
import { whatsapp } from "./clients/whatsapp";
import { checkEnv } from "./helpers/utils";

async function main() {
  checkEnv();
  whatsapp.initialize();
}

process.on("SIGINT", async () => {
  console.warn("[SIGINT] Shutting down...");
  // should react to every pending message and warn the user that the bot is shutting down
  await whatsapp.destroy();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.warn("[SIGTERM] Shutting down...");
  // should react to every pending message and warn the user that the bot is shutting down
  await whatsapp.destroy();
  process.exit(0);
});

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
