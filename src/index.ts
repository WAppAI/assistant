import { whatsapp } from "./clients/whatsapp";
import { checkEnv } from "./helpers/utils";

function main() {
  checkEnv();
  whatsapp.initialize();
}

process.on("SIGINT", async () => {
  console.warn("[SIGINT] Shutting down...");
  await whatsapp.destroy();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.warn("[SIGTERM] Shutting down...");
  await whatsapp.destroy();
  process.exit(0);
});

main();
