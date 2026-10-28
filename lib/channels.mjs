// Delivery: send a line from Gertrude to a person on the channels they gave her. Web Push (VAPID, the person's own browser
// subscription) and ntfy (a topic they named). Email and SMS plug in here later with the same shape. Every delivery is also
// written to the one log as an "out" event on that channel, so the next conversation knows what she said.
import "./env.mjs"; import webpush from "web-push"; import { channel as channels, event } from "./store.mjs";
const { VAPID_PUBLIC, VAPID_PRIVATE, VAPID_SUBJECT = "mailto:anselm@gmail.com" } = process.env;
export const pushConfigured = () => !!(VAPID_PUBLIC && VAPID_PRIVATE); if (pushConfigured()) webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
export const publicKey = () => VAPID_PUBLIC || "";
async function sendOne(c, { title, text, url }) {
  if (c.kind === "webpush") { if (!pushConfigured()) throw new Error("push not configured"); try { await webpush.sendNotification(c.address, JSON.stringify({ title, body: text, url }), { TTL: 24 * 3600 }); } catch (e) { if (e.statusCode === 404 || e.statusCode === 410) { channels.drop(c.id); throw new Error("subscription gone (removed)"); } throw e; } return; }
  if (c.kind === "ntfy") { const { server = "https://ntfy.sh", topic } = c.address; const r = await fetch(`${server.replace(/\/+$/, "")}/${topic}`, { method: "POST", headers: { Title: title, Priority: "3", Tags: "older_woman", Click: url }, body: text, signal: AbortSignal.timeout(8000) }); if (!r.ok) throw new Error("ntfy " + r.status); return; }
  throw new Error("no sender for " + c.kind);
}
// Deliver to every channel the person has; record once in the log (channel name = the first kind that worked). Returns what happened.
export async function deliver(person, text, { title = "Gertrude", url = (process.env.PUBLIC_ORIGIN || "https://gertrude.exe.xyz") + "/", log = true } = {}) {
  const list = channels.list(person.id); const outcome = []; let ok = null;
  for (const c of list) { try { await sendOne(c, { title, text, url }); channels.sent(c.id); outcome.push({ id: c.id, kind: c.kind, ok: true }); ok ??= c.kind; } catch (e) { channels.failed(c.id); outcome.push({ id: c.id, kind: c.kind, ok: false, error: e.message }); } }
  if (log && ok) event.add(person.id, ok, "out", text, { nudge: true, delivered: outcome });
  return { delivered: !!ok, outcome };
}
export const reachable = (personId) => channels.list(personId).length > 0;
