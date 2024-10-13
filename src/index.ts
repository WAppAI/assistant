import { sock } from "./clients/new-whatsapp";
import { prisma } from "./clients/prisma";
import { pulseForAllConversations } from "./handlers/pulse";
import { checkEnv } from "./helpers/utils";
import schedule from "node-schedule";

async function main() {
  checkEnv();

  const pulseTimes = process.env.PULSE_FREQUENCY?.split(",") || [];
  pulseTimes.forEach((time) => {
    const [hour, minute] = time.split(":").map(Number);
    if (!isNaN(hour) && !isNaN(minute)) {
      schedule.scheduleJob({ hour, minute }, async () => {
        try {
          await pulseForAllConversations(
            `SYSTEM: This is a pulse, remember to return 'false' if there is nothing important to say. Server time (and presumably the user's time) is ${new Date().toLocaleString()}`,
            sock
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

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
