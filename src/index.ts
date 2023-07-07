import cli from "./clients/cli";
import { whatsapp } from "./clients/whatsapp";

async function main() {
  cli.printIntro();
  whatsapp.initialize();
}

main();
