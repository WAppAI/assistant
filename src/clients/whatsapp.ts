import { Client } from "whatsapp-web.js";

export const whatsapp = new Client({
  puppeteer: {
    headless: true,
    args: [
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--disable-setuid-sandbox",
      "--no-sandbox",
    ],
  },
});
