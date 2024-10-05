import { prisma } from "./clients/prisma";
import { whatsapp } from "./clients/whatsapp";
import { checkEnv } from "./helpers/utils";
import { pulseForAllConversations } from "./handlers/pulse";
import schedule from "node-schedule";

async function main() {
  checkEnv();
  whatsapp.initialize();

  const pulseTimes = process.env.PULSE_FREQUENCY?.split(",") || [];
  pulseTimes.forEach((time) => {
    const [hour, minute] = time.split(":").map(Number);
    if (!isNaN(hour) && !isNaN(minute)) {
      schedule.scheduleJob({ hour, minute }, async () => {
        try {
          await pulseForAllConversations(
            `SYSTEM: This is a pulse, remember to return 'false' if there is nothing important to say. Server time (and presumably the user's time) is ${new Date().toLocaleString()}`
          );
        } catch (error) {
          console.error(
            `Error running pulseForAllConversations at ${time}:`,
            error
          );
        }
      });
    } else {
      console.error(`Invalid time format in PULSE_FREQUENCY: ${time}`);
    }
  });
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
