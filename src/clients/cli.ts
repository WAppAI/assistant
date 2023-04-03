import { intro, spinner, note, outro } from "@clack/prompts";
import color from "picocolors";

const s = spinner();

const print = (text: string) => {
  console.log(color.green("◇") + "  " + text);
};

const printIntro = () => {
  intro(color.bgCyan(color.white(" Sydney WhatsApp Chatbot ")));
  note(
    "A Whatsapp bot that uses BingAI's Sydney to generate text from a prompt."
  );
  s.start("Starting");
};

const printQRCode = (qr: string) => {
  s.stop("Client is ready!");
  note(qr, "Scan the QR code below to login to Whatsapp Web.");
  s.start("Waiting for QR code to be scanned");
};

const printLoading = () => {
  s.stop("Authenticated!");
  s.start("Logging in");
};

const printAuthenticated = () => {
  s.stop("Session started!");
  s.start("Opening session");
};

const printAuthenticationFailure = () => {
  s.stop("Authentication failed!");
};

const printReady = () => {
  s.stop("Loaded!");
  outro("Sydney WhatsApp Chatbot is now ready to use.");
};

export default {
  s,
  print,
  printIntro,
  printQRCode,
  printLoading,
  printAuthenticated,
  printAuthenticationFailure,
  printReady
};
