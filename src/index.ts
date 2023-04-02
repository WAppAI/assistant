import { whatsapp } from "./clients/whatsapp";

async function main() {
  whatsapp.initialize()
}

main().catch(console.log)