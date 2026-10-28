// The persona lives in persona/gertrude.md so anyone can improve her by pull request. This module reads it and shapes the
// system prompt: the stable part (persona, house rules) first so it caches, the per-person part after.
import { readFileSync } from "node:fs"; import { join, dirname } from "node:path"; import { fileURLToPath } from "node:url";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), ".."); const FILE = join(ROOT, "persona", "gertrude.md");
let text = "", loadedAt = 0; export function personaText() { if (!text || Date.now() - loadedAt > 60e3) { text = readFileSync(FILE, "utf8"); loadedAt = Date.now(); } return text; }
export function openingLine() { const m = personaText().match(/## The opening line for someone new\s+([\s\S]+?)(\n## |\s*$)/); return (m ? m[1] : "Hello, I'm Gertrude.").replace(/\s+/g, " ").trim(); }
// What the model sees about the person: the card, consents, and the channel. Kept short; the log itself is the message history.
export function personBlock({ person, card, channel, consents = [], leads = [], edges = [], device = "", channels = [] }) {
  const lines = [`## What you know about this person`, `Name on file: ${person.name || "(not given yet)"}. Attest handle: ${person.handle || "(none)"}. Channel now: ${channel}.${person.place ? ` They shared their location: near ${person.place} (coarse).` : ""}`];
  if (card) { const { _updated, _through, _by, ...c } = card; lines.push(`Card (last rewritten ${_updated}):`, JSON.stringify(c, null, 1)); } else lines.push("No card yet: this is early in your acquaintance.");
  if (consents.length) lines.push("Consents on file: " + consents.filter((c) => !c.revoked_at).map((c) => c.kind).join(", "));
  if (device) lines.push(`Their device right now: ${device}. Ways you can reach them: ${channels.length ? channels.map((c) => c.kind).join(", ") : "none yet"}.${channels.length ? "" : /iPhone/.test(device) && !/installed/.test(device) ? " If you ask them to put you on their phone, the exact steps on an iPhone are: open this page in Safari, tap the Share button (the square with the arrow pointing up), choose Add to Home Screen, then open Gertrude from the home screen and turn on notifications on the card page." + (/Chrome|Firefox|Edge/.test(device) ? " They are not in Safari now; it has to be Safari for this." : "") : /Android/.test(device) ? " On Android: the browser menu, Install app or Add to Home screen, then notifications on the card page." : /Mac|Windows|Linux/.test(device) ? " On a computer: the install icon at the right end of the address bar, or the browser menu, Install Gertrude." : ""}`);
  const nd = person.nudge_days ?? 7; lines.push(`How often you may write to them unprompted: ${nd === 0 ? "never (their choice)" : "at most once every " + (nd === 1 ? "day" : nd + " days")}; quiet hours ${person.quiet_from ?? 21}:00–${person.quiet_to ?? 8}:00. They can change this by telling you (settings tool) or on their card page.`);
  if (leads.length) lines.push("People they have pointed you at (your notes only; ask how the sending went, do not re-ask for a link that exists): " + leads.map((l) => `${l.name}${l.about ? " (" + l.about + ")" : ""}: ${l.arrived ? "arrived " + l.arrived.slice(0, 10) : l.invite ? "link made, not yet used" : "noted, no link"}`).join("; "));
  if (edges.length) lines.push("Connected on the graph to: " + edges.map((e) => e.a === person.id ? e.b_name || "someone" : e.a_name || "someone").join(", "));
  lines.push(`Today is ${new Date().toISOString().slice(0, 10)}.`);
  return lines.join("\n");
}
