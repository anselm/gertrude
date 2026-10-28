// The thinker: after a person has been quiet for a while, rewrite their card from the whole log. Slow and careful (Opus),
// structured output, provenance by quotation. Also runnable on demand from the admin page. The card is what the talker
// carries into every later turn, on every channel, so this is where memory actually lives.
import { person as persons, event, card as cards, llm as ledger } from "./store.mjs"; import * as llm from "./llm.mjs"; import { personaText } from "./persona.mjs";
export const IDLE_MS = Number(process.env.THINK_IDLE_MS || 3 * 60e3);
const SCHEMA = { type: "object", additionalProperties: false, required: ["name", "summary", "needs", "offers", "interests", "people_in_kind", "facts", "open_threads", "keep_private", "tone"], properties: {
  name: { type: "string", description: "what they want to be called, or empty" }, summary: { type: "string", description: "two or three plain sentences about who this is and what they are up to" },
  needs: { type: "array", items: { type: "string" } }, offers: { type: "array", items: { type: "string" } }, interests: { type: "array", items: { type: "string" } },
  people_in_kind: { type: "array", items: { type: "string" }, description: "the kinds of people they said they would like to meet" },
  facts: { type: "array", items: { type: "object", additionalProperties: false, required: ["text", "quote", "public"], properties: { text: { type: "string" }, quote: { type: "string", description: "their own words that support it" }, public: { type: "boolean", description: "false if they marked it private or it is plainly sensitive" } } } },
  open_threads: { type: "array", items: { type: "string" }, description: "questions Gertrude asked and did not get answered, promises she made, things to come back to" },
  keep_private: { type: "array", items: { type: "string" }, description: "things they asked her to forget or keep private; listed only so she does not raise them again" },
  tone: { type: "string", description: "one line on how to talk to this person" } } };
const SYSTEM = () => `You are the reflective half of Gertrude, whose persona and rules follow. Your job is to rewrite the card Gertrude keeps on one person from the full transcript of what they have said to her, on any channel. Write only what the person said about themselves. Anything they said about other people goes nowhere: not in facts, not in summary. If they asked for something to be forgotten, it goes only in keep_private, in neutral words. Quote their own words as provenance for every fact. Plain language, no flattery.\n\n${personaText()}`;
export async function rethink(id, by = "thinker") {
  const p = persons.byId(id); if (!p) throw new Error("no such person"); const events = event.recent(id, 400); if (!events.length) return null; const through = events[events.length - 1].id;
  const transcript = events.map((e) => `${e.ts.slice(0, 16)} ${e.channel} ${e.dir === "in" ? "THEM" : "GERTRUDE"}: ${e.text}`).join("\n");
  const prior = cards.get(id); const user = `Previous card (may be empty):\n${prior ? JSON.stringify(prior) : "none"}\n\nTranscript:\n${transcript}\n\nRewrite the card.`;
  const json = await llm.complete({ system: SYSTEM(), user, schema: SCHEMA, person: id, purpose: "card" }); cards.set(id, json, through, by); if (json.name && !p.name) persons.setName(id, json.name); return cards.get(id);
}
// Sweep: anyone whose log moved past their card and who has been quiet for IDLE_MS gets a rethink. Runs in-process on a timer.
export async function sweep() { const due = cards.stale(IDLE_MS); for (const r of due) { try { await rethink(r.id); console.log("thinker: card for", r.name || r.id); } catch (e) { console.error("thinker:", r.id, e.message); } } return due.length; }
export function start(everyMs = 60e3) { if (!llm.configured()) { console.log("thinker: no api key; idle"); return; } setTimeout(sweep, 10e3); return setInterval(sweep, everyMs); }
