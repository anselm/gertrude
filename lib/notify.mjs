// Phone alerts through ntfy (harness/private/ntfy.md). Topic from NTFY_TOPIC or ~/.config/ntfy/topic; silent when neither is set.
import "./env.mjs"; import { readFileSync } from "node:fs"; import { homedir } from "node:os"; import { join } from "node:path";
const read = (f) => { try { return readFileSync(f, "utf8").trim(); } catch { return ""; } };
const TOPIC = process.env.NTFY_TOPIC || read(join(homedir(), ".config", "ntfy", "topic")); const SERVER = (process.env.NTFY_SERVER || read(join(homedir(), ".config", "ntfy", "server")) || "https://ntfy.sh").replace(/\/+$/, "");
export const configured = () => !!TOPIC;
export async function notify(title, body, { priority = 3, tags = "", click = "", actions = "" } = {}) {
  if (!TOPIC) return false; const headers = { Title: title, Priority: String(priority) }; if (tags) headers.Tags = tags; if (click) headers.Click = click; if (actions) headers.Actions = actions; if (process.env.NTFY_TOKEN) headers.Authorization = "Bearer " + process.env.NTFY_TOKEN;
  try { const r = await fetch(`${SERVER}/${TOPIC}`, { method: "POST", headers, body, signal: AbortSignal.timeout(8000) }); return r.ok; } catch { return false; }
}
