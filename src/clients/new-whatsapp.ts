import { Boom } from "@hapi/boom";
import readline from "readline";
import {
  makeWASocket,
  downloadMediaMessage,
  DisconnectReason,
  useMultiFileAuthState,
  type proto,
  fetchLatestBaileysVersion,
  AnyMessageContent,
  delay,
  getAggregateVotesInPollMessage,
  WAMessageKey,
  WAMessageContent,
} from "@whiskeysockets/baileys";

// start a connection
import { WASocket } from "@whiskeysockets/baileys";

export const connectToWhatsApp = async (): Promise<WASocket> => {
  const { state, saveCreds } = await useMultiFileAuthState("wa_auth");
  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(`using WA v${version.join(".")}, isLatest: ${isLatest}`);

  const sock = makeWASocket({
    version,
    printQRInTerminal: true,
    auth: state,
    generateHighQualityLinkPreview: true,
    // ignore all broadcast messages -- to receive the same
    // comment the line below out
    // shouldIgnoreJid: jid => isJidBroadcast(jid),
    // implement to handle retries & poll updates
  });

  // the process function lets you process all events that just occurred
  // efficiently in a batch
  sock.ev.process(
    // events is a map for event name => event data
    async (events) => {
      // something about the connection changed
      // maybe it closed, or we received all offline message or connection opened
      if (events["connection.update"]) {
        const update = events["connection.update"];
        const { connection, lastDisconnect } = update;
        if (connection === "close") {
          // reconnect if not logged out
          if (
            (lastDisconnect?.error as Boom)?.output?.statusCode !==
            DisconnectReason.loggedOut
          ) {
            connectToWhatsApp();
          } else {
            console.log("Connection closed. You are logged out.");
          }
        }

        console.log("connection update", update);
      }

      // received a new message
      if (events["messages.upsert"]) {
        const upsert = events["messages.upsert"];
        console.log("recv messages ", JSON.stringify(upsert, undefined, 2));

        if (upsert.type === "notify") {
          for (const msg of upsert.messages) {
            console.log("replying to", msg.key.remoteJid);
            await sock!.readMessages([msg.key]);
            await sock.sendMessage(msg.key.remoteJid!, {
              text: "Hello there!",
            });
          }
        }
      }

      /* // messages updated like status delivered, message deleted etc.
      if (events["messages.update"]) {
        console.log(JSON.stringify(events["messages.update"], undefined, 2));
      }

      if (events["message-receipt.update"]) {
        console.log(events["message-receipt.update"]);
      }

      if (events["messages.reaction"]) {
        console.log(events["messages.reaction"]);
      }

      if (events["presence.update"]) {
        console.log(events["presence.update"]);
      }

      if (events["chats.update"]) {
        console.log(events["chats.update"]);
      } */

      /* if (events["contacts.update"]) {
        for (const contact of events["contacts.update"]) {
          if (typeof contact.imgUrl !== "undefined") {
            const newUrl =
              contact.imgUrl === null
                ? null
                : await sock!.profilePictureUrl(contact.id!).catch(() => null);
            console.log(
              `contact ${contact.id} has a new profile pic: ${newUrl}`
            );
          }
        }
      }

      if (events["chats.delete"]) {
        console.log("chats deleted ", events["chats.delete"]);
      } */

      /* // credentials updated -- save them
      if (events["creds.update"]) {
        await saveCreds();
      }

      if (events["labels.association"]) {
        console.log(events["labels.association"]);
      }

      if (events["labels.edit"]) {
        console.log(events["labels.edit"]);
      }

      if (events.call) {
        console.log("recv call event", events.call);
      }

      // history received
      if (events["messaging-history.set"]) {
        const { chats, contacts, messages, isLatest } =
          events["messaging-history.set"];
        console.log(
          `recv ${chats.length} chats, ${contacts.length} contacts, ${messages.length} msgs (is latest: ${isLatest})`
        );
      } */
    }
  );

  return sock;
};
