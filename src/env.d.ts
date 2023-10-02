declare module "bun" {
  interface Env {
    ENABLE_REACTIONS: "true" | "false" | "dms_only" | "groups_only";
    QUEUED_REACTION: string | "🔁";
    WORKING_REACTION: string | "⚙️";
    DONE_REACTION: string | "✅";
    ERROR_REACTION: string | "⚠️";

    PUPPETEER_EXECUTABLE_PATH: string;
  }
}
