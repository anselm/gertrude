// The matcher: the thinker's other job. Over the cards of everyone in the circle it shortlists, per person, who they ought to
// meet; drafts, for the best pair, what each side will hear about the other (from that side's own words, no names) and the
// exact question Gertrude will put to each; Anselm approves or declines (ntfy actions or the admin page); the asks go out as
// approved nudges (quiet hours, channels, or the log for people with none); the talker records each answer with the
// `intro_answer` tool; two yeses make the introduction, and only then does either side learn the other's name and the line
// they chose to hand over for being reached. Caps: one open introduction per person; a pair is not retried for 90 days;
// at most MAX_PER_REVIEW new proposals per review.
import "./env.mjs"; import { person as persons, card as cards, intro as intros, nudge as nudges, edge as edges } from "./store.mjs"; import * as llm from "./llm.mjs"; import { personaText } from "./persona.mjs"; import { notify } from "./notify.mjs"; import { sign, dispatch } from "./nudge.mjs";
const ORIGIN = (process.env.PUBLIC_ORIGIN || "https://gertrude.exe.xyz").replace(/\/+$/, ""); const SECRET = process.env.NUDGE_SECRET || "";
export const MATCH_MODEL = process.env.MATCH_MODEL || "claude-sonnet-5-5"; const MIN_SCORE = Number(process.env.MATCH_MIN || 0.6), RETRY_DAYS = 90, MAX_PER_REVIEW = Number(process.env.MATCH_MAX || 5);
// What the circle may see of a card: the person's own public material, nothing they marked private, no name.
export function publicCard(c) { if (!c) return null; return { summary: c.summary || "", needs: c.needs || [], offers: c.offers || [], interests: c.interests || [], people_in_kind: c.people_in_kind || [], facts: (c.facts || []).filter((f) => f.public).map((f) => f.text) }; }
const substantial = (c) => c && ((c.needs || []).length + (c.offers || []).length + (c.people_in_kind || []).length) > 0;
const knowEachOther = (a, b) => edges.of(a).some((e) => (e.a === a && e.b === b) || (e.a === b && e.b === a));
const triedLately = (a, b) => { const i = intros.between(a, b); return !!i && (["proposed", "approved", "made"].includes(i.state) || Date.now() - Date.parse(i.created) < RETRY_DAYS * 864e5); };
export function eligible(p) { if (p.status !== "active") return "paused"; if (intros.hasOpen(p.id)) return "an introduction is already in play"; const c = cards.get(p.id); if (!c) return "no card"; if (!substantial(c)) return "card says nothing to match on"; return null; }
// Everyone else's public card, keyed by id, as one block (cached across the calls of a review).
function circle(exceptId) { const out = []; for (const p of persons.list(500)) { if (p.id === exceptId || p.status !== "active") continue; const c = cards.get(p.id); if (!substantial(c)) continue; out.push({ id: p.id, place: p.place || "", ...publicCard(c) }); } return out; }
const SHORTLIST = { type: "object", additionalProperties: false, required: ["picks"], properties: { picks: { type: "array", items: { type: "object", additionalProperties: false, required: ["id", "score", "why"], properties: { id: { type: "string" }, score: { type: "number", description: "0 to 1: how much good an introduction would do both of them" }, why: { type: "string", description: "one line, for the operator" } } } } } };
export async function shortlist(id) {
  const p = persons.byId(id); const c = cards.get(id); const others = circle(id).filter((o) => !knowEachOther(id, o.id) && !triedLately(id, o.id) && !intros.hasOpen(o.id)); if (!others.length) return [];
  const system = [{ text: `You are the matchmaking half of Gertrude (persona below). From the circle, pick at most three people this person ought to be introduced to, for the good of BOTH: a need met by an offer, work in common, the kind of person each said they want to meet, nearby when that matters. Prefer one strong match to three weak ones. Return an empty list if nothing is real. Score honestly; 0.6 is the bar.\n\n${personaText()}`, cache: true }, { text: "The circle (each entry is one person's own public card, no names):\n" + JSON.stringify(others), cache: true }];
  const user = `This person${p.place ? ", near " + p.place : ""}: ${JSON.stringify(publicCard(c))}\n\nWho in the circle should they meet?`;
  const j = await llm.complete({ system, user, schema: SHORTLIST, person: id, purpose: "match", model: MATCH_MODEL, effort: "medium", maxTokens: 800 });
  return j.picks.filter((x) => others.some((o) => o.id === x.id) && x.score >= MIN_SCORE).sort((x, y) => y.score - x.score);
}
const DRAFT = { type: "object", additionalProperties: false, required: ["go", "why", "blurb_a", "blurb_b", "ask_a", "ask_b"], properties: { go: { type: "boolean", description: "false if, on reflection, this introduction would not do both of them good" }, why: { type: "string", description: "one line for the operator" },
  blurb_a: { type: "string", description: "one or two sentences about A for B to hear, built only from A's own public card, no name, no contact details, no third parties" }, blurb_b: { type: "string", description: "the same about B, for A" },
  ask_a: { type: "string", description: "what Gertrude says to A, in her voice, two to four plain sentences: who she has in mind (blurb_b, unnamed), what she would tell them about A (blurb_a), that nothing moves unless both say yes, and the question" }, ask_b: { type: "string", description: "the same, to B" } } };
// Draft one introduction for a pair; proposed, not sent. Returns the row or a reason.
export async function draft(aId, bId, why = "", score = null, by = "matcher") {
  const a = persons.byId(aId), b = persons.byId(bId); if (!a || !b) throw new Error("no such person"); if (intros.hasOpen(aId) || intros.hasOpen(bId)) return { skipped: "one of them has an introduction in play" }; if (triedLately(aId, bId)) return { skipped: "tried lately" };
  const system = `You are the matchmaking half of Gertrude (persona below). Two people in her circle look like a fit. Write what each will hear about the other, and the question she will put to each. Rules you do not break: no names; nothing either marked private; no contact details, employers, addresses; nothing one person said about anyone else; only what each said about themselves. She asks, she never sells; a no is fine. Plain words, her voice, no lists.\n\n${personaText()}`;
  const user = `A${a.place ? " (near " + a.place + ")" : ""}: ${JSON.stringify(publicCard(cards.get(aId)))}\n\nB${b.place ? " (near " + b.place + ")" : ""}: ${JSON.stringify(publicCard(cards.get(bId)))}\n\nWhy they were shortlisted: ${why || "(not given)"}\n\nDraft the introduction.`;
  const j = await llm.complete({ system, user, schema: DRAFT, person: aId, purpose: "intro", effort: "high", maxTokens: 1500 });
  if (!j.go) return { skipped: "on reflection: " + j.why };
  const i = intros.add({ a: aId, b: bId, score, why: j.why, blurb_a: j.blurb_a, blurb_b: j.blurb_b, ask_a: j.ask_a, ask_b: j.ask_b, by });
  const actions = SECRET ? `http, Approve, ${ORIGIN}/intro/${i.id}/approve?k=${sign("intro:" + i.id, "approve")}, method=POST, clear=true; http, Decline, ${ORIGIN}/intro/${i.id}/decline?k=${sign("intro:" + i.id, "decline")}, method=POST, clear=true` : "";
  await notify(`Gertrude wants to introduce ${a.name || a.handle} and ${b.name || b.handle}`, `${j.why}\n\nTo ${a.name || a.handle}: "${j.ask_a}"\n\nTo ${b.name || b.handle}: "${j.ask_b}"`, { tags: "two_women_holding_hands", click: ORIGIN + "/admin", actions, priority: 3 });
  return { intro: i };
}
// Approve: queue the two asks as approved nudges (the dispatcher minds quiet hours and channels, and writes to the log for
// people with none). Decline: that is that, for 90 days.
export function decide(id, action, by = "admin") { const i = intros.get(id); if (!i) throw new Error("no such introduction"); if (i.state !== "proposed") return i;
  if (action !== "approve") { intros.setState(id, "declined"); return intros.get(id); }
  intros.setState(id, "approved"); nudges.add(i.a, "intro_ask", i.ask_a, "introduction " + id + " (approved by " + by + ")", id, "approved"); nudges.add(i.b, "intro_ask", i.ask_b, "introduction " + id + " (approved by " + by + ")", id, "approved");
  return intros.get(id); }
// One side answers (from the talker's tool). A no drops it; two yeses with reach lines make it.
export async function answer(id, personId, yes, said = "", reach = "") { const i = intros.get(id); if (!i) throw new Error("no such introduction"); const side = i.a === personId ? "a" : i.b === personId ? "b" : null; if (!side) throw new Error("not their introduction"); if (!["approved"].includes(i.state)) return { state: i.state, note: "this introduction is no longer open" };
  intros.answer(id, side, yes, said, reach); if (!yes) { intros.setState(id, "dropped"); return { state: "dropped", note: "noted; the other person will only hear that it did not work out, if they ask" }; }
  const j = intros.get(id); const mine = j[side + "_reach"], other = side === "a" ? j.b_answer : j.a_answer, otherReach = side === "a" ? j.b_reach : j.a_reach;
  if (!mine) return { state: "approved", note: "yes recorded; now ask what they would like the other person to be given to reach them (an email, a phone number, a handle, whatever they choose), then call this tool again with it" };
  if (other !== "yes" || !otherReach) return { state: "approved", note: "yes recorded with a way to reach them; the other side has not answered yet, so say you will come back when they have" };
  await make(id); return { state: "made", note: "both said yes: the introduction has been sent to both; tell them so" }; }
export async function make(id) { const i = intros.get(id); if (i.state !== "approved") return i; intros.made(id);
  const line = (name, blurb, reach) => `You both said yes, so: this is ${name}. ${blurb} ${name} said you can reach them here: ${reach}. I'll leave the two of you to it; do tell me how it goes.`;
  nudges.add(i.a, "intro", line(i.b_name || i.b_handle, i.blurb_b, i.b_reach), "introduction made " + id, id, "approved"); nudges.add(i.b, "intro", line(i.a_name || i.a_handle, i.blurb_a, i.a_reach), "introduction made " + id, id, "approved");
  notify("Gertrude made an introduction", `${i.a_name || i.a_handle} and ${i.b_name || i.b_handle}: ${i.why}`, { tags: "tada" }).catch(() => {}); dispatch().catch(() => {}); return intros.get(id); }
export function outcome(id, personId, o) { const i = intros.get(id); if (!i) throw new Error("no such introduction"); const side = i.a === personId ? "a" : i.b === personId ? "b" : null; if (!side) throw new Error("not their introduction"); intros.outcome(id, side, o); return intros.get(id); }
// The review: for each eligible person, shortlist, then draft for the best pair. One proposal per person per review at most.
export async function review() { const out = []; let made = 0; for (const p of persons.list(500)) { if (made >= MAX_PER_REVIEW) break; const why = eligible(p); if (why) { out.push([p.id, why]); continue; }
  try { const picks = await shortlist(p.id); if (!picks.length) { out.push([p.id, "no match"]); continue; } const best = picks[0]; const r = await draft(p.id, best.id, best.why, best.score); out.push([p.id, r.intro ? "proposed with " + best.id : r.skipped]); if (r.intro) made++; } catch (e) { out.push([p.id, "error: " + e.message]); } }
  return out; }
export function start() { if (!llm.configured()) return; const everyMs = Number(process.env.MATCH_EVERY_MS || 6 * 3600e3); setTimeout(() => review().then((r) => console.log("match review:", JSON.stringify(r))).catch((e) => console.error("match:", e.message)), 120e3); setInterval(() => review().catch((e) => console.error("match:", e.message)), everyMs); }
// For the talker's context: what is in play for this person, in words she can act on.
export function inPlay(personId) { return intros.of(personId, 10).filter((i) => ["approved", "made"].includes(i.state) || (i.state === "dropped" && Date.now() - Date.parse(i.decided || i.created) < 7 * 864e5)).map((i) => { const side = i.a === personId ? "a" : "b"; const mine = i[side + "_answer"], theirs = i[(side === "a" ? "b" : "a") + "_answer"], reach = i[side + "_reach"], other = side === "a" ? (i.b_name || i.b_handle) : (i.a_name || i.a_handle);
  if (i.state === "made") return `#${i.id}: MADE ${i.made.slice(0, 10)} with ${other}. ${!i["outcome_" + side] && Date.now() - Date.parse(i.made) > 10 * 864e5 ? "No word yet on how it went: ask once (intro_outcome)." : "Outcome on file: " + (i["outcome_" + side] || "none yet") + "."}`;
  if (i.state === "dropped") return `#${i.id}: did not go ahead (${mine === "no" ? "they said no" : "the other side said no"}); if they ask, say only that it did not work out this time.`;
  return `#${i.id}: OPEN. You asked: "${i[side === "a" ? "ask_a" : "ask_b"]}" Their answer so far: ${mine || "none"}${mine === "yes" && !reach ? " (yes, but no way to reach them yet: ask what they want handed over)" : ""}. The other side: ${theirs ? (theirs === "yes" ? "has said yes" : "said no") : "not yet answered"}. Record their answer with intro_answer.`; }); }
