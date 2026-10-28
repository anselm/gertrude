// The persona lives in persona/gertrude.md so anyone can improve her by pull request. This module reads it and shapes the
// system prompt: the stable part (persona, house rules) first so it caches, the per-person part after.
import { readFileSync } from "node:fs"; import { join, dirname } from "node:path"; import { fileURLToPath } from "node:url";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), ".."); const FILE = join(ROOT, "persona", "gertrude.md");
let text = "", loadedAt = 0; export function personaText() { if (!text || Date.now() - loadedAt > 60e3) { text = readFileSync(FILE, "utf8"); loadedAt = Date.now(); } return text; }
export function openingLine() { const m = personaText().match(/## The opening line for someone new\s+([\s\S]+?)(\n## |\s*$)/); return (m ? m[1] : "Hello, I'm Gertrude.").replace(/\s+/g, " ").trim(); }
// What the model sees about the person: the card, consents, and the channel. Kept short; the log itself is the message history.
export function personBlock({ person, card, channel, consents = [] }) {
  const lines = [`## What you know about this person`, `Name on file: ${person.name || "(not given yet)"}. Attest handle: ${person.handle || "(none)"}. Channel now: ${channel}.`];
  if (card) { const { _updated, _through, _by, ...c } = card; lines.push(`Card (last rewritten ${_updated}):`, JSON.stringify(c, null, 1)); } else lines.push("No card yet: this is early in your acquaintance.");
  if (consents.length) lines.push("Consents on file: " + consents.filter((c) => !c.revoked_at).map((c) => c.kind).join(", "));
  lines.push(`Today is ${new Date().toISOString().slice(0, 10)}.`);
  return lines.join("\n");
}
