// Gertrude's brain for the voice package. Two speeds: the mouth (a quick model on the short persona) answers every turn; the
// mind (the full talker with its tools) listens along after each exchange and leaves the mouth a briefing. A few shapes
// need no model at all. Nothing is stored until LiveKit commits the turn, because a reply may be started early on an
// interim transcript and thrown away; the log is written from what was actually heard and actually played.
import { person as persons, event } from "./store.mjs"; import * as talker from "./talker.mjs"; import { openingLine } from "./persona.mjs";
const LINE_OPENER = "Hello, it's Gertrude. We're on the telephone now, as it were, so I'll keep things short. What's on your mind?";
const GOODBYES = ["Goodbye, dear. Ring me whenever you like.", "Bye for now. I'll be here.", "Good night, then. Mind how you go."];
// A callback producer as an async iterable: chunks arrive through onText, the iterable ends when the promise settles, and
// a consumer that stops early (LiveKit discarding a preemptive turn) aborts the request behind it.
function streamOf(run) { const q = []; let wake = null, done = false; const ac = new AbortController(); const push = (t) => { if (t) q.push(t); wake?.(); wake = null; };
  run(push, ac.signal).catch(() => {}).finally(() => { done = true; wake?.(); });
  return { [Symbol.asyncIterator]() { return { async next() { while (true) { if (q.length) return { value: q.shift(), done: false }; if (done) return { value: undefined, done: true }; await new Promise((r) => (wake = r)); } }, async return() { ac.abort(); done = true; wake?.(); return { value: undefined, done: true }; } }; } }; }
const once = (text) => (async function* () { yield text; })();
// Each respond() is an attempt (LiveKit may start several per turn and keep one). What it produced is matched in spoke()
// against what actually played, so a rule's flags belong to the reply that came from it and not to whatever was playing.
function attempt(ctx, { byRule = false, hangup = false } = {}) { const a = { text: "", byRule, hangup, used: false }; ctx.attempts.push(a); if (ctx.attempts.length > 8) ctx.attempts.shift(); return a; }
const norm = (s) => (s || "").replace(/\s+/g, " ").trim();
function ruled(ctx, text, flags) { attempt(ctx, { byRule: true, ...flags }).text = text; return once(text); }
// The shapes that need no model. Kept narrow on purpose: a rule that misfires sounds like a phone menu.
const RE_AGAIN = /^\W*(?:sorry|pardon|what|pardon me|sorry what)\W*$|say (?:that|it) again|what was that|didn'?t (?:catch|hear|get) (?:that|you|it)|come again|repeat that/i;
const RE_BYE = /\b(?:good ?bye|bye(?: for now| now)?|good ?night|talk (?:to you )?(?:later|soon)|that'?s all for now|(?:i'?ve |i )(?:got|have|need) to (?:go|run|dash)|gotta go|hang up now|cheerio)\b/i;
const RE_NOT = /\b(?:don'?t|do not|never|not|no)\b/i;
const RE_HOLD = /^\W*(?:hold on|hang on|one (?:moment|second|sec|minute)|just a (?:moment|second|sec|minute|tick)|wait(?: a (?:moment|second|sec|minute))?|bear with me)\W*$/i;
const words = (t) => t.trim().split(/\s+/).filter(Boolean).length; const DEBUG = !!process.env.VOICE_DEBUG;
const sec = (x) => x == null ? undefined : Math.round(x < 100 ? x * 1000 : x);
export const brain = {
  async open(ctx) { const p = persons.byId(ctx.identity); if (!p || p.status !== "active") return null; ctx.person = p; ctx.briefing = ""; ctx.lastSaid = ""; ctx.attempts = []; ctx.thinking = Promise.resolve();
    const greeting = event.recent(p.id, 1).length ? LINE_OPENER : openingLine();
    ctx.greeting = event.add(p.id, "voice", "out", greeting, { voice: true, call: ctx.callId, opening: true }); ctx.lastSaid = greeting;
    talker.warmMouth(p); talker.warm(p, "voice", talker.THINKER_HOUSE); return { greeting }; },
  // One user turn, possibly interim. Rules first, then the mouth.
  respond(text, ctx) { const t = (text || "").trim();
    if (!t) return ruled(ctx, "Mm?");
    if (RE_AGAIN.test(t) && words(t) <= 8) return ruled(ctx, ctx.lastSaid || "I hadn't said anything yet, dear.");
    if (RE_HOLD.test(t)) return ruled(ctx, "Take your time.");
    if (RE_BYE.test(t) && words(t) <= 10 && !RE_NOT.test(t)) return ruled(ctx, GOODBYES[Math.floor(Math.random() * GOODBYES.length)], { hangup: true });
    const a = attempt(ctx); const n = ctx.attempts.length; if (DEBUG) console.log(`brain: attempt ${n} on "${t.slice(0, 60)}"`);
    return streamOf((onText, signal) => talker.mouth({ person: ctx.person, text: t, onText: (c) => { a.text += c; onText(c); }, briefing: ctx.briefing, signal }).then((r) => { if (DEBUG) console.log(`brain: attempt ${n} ${r.aborted ? "aborted" : "done"} ${a.text.length} chars${r.error ? " error " + r.error : ""}`); return r; })); },
  // The turn is committed: this is what she heard.
  heard(text, ctx) { if (!ctx.person || !text?.trim()) return; ctx.lastIn = event.add(ctx.person.id, "voice", "in", text.trim(), { voice: true, call: ctx.callId }); },
  // The reply has played (or been cut off): this is what the person heard. Store it, then let the mind think.
  spoke(text, { interrupted, metrics } = {}, ctx) { const p = ctx.person; if (!p) return; const m = metrics || {};
    const meta = { voice: true, call: ctx.callId, ms: { eou: sec(m.endOfTurnDelay), ttft: sec(m.llmNodeTtft), ttfb: sec(m.ttsNodeTtfb) }, ...(interrupted ? { interrupted: true } : {}) };
    const said = (text || "").trim(); ctx.hangupAfter = false;
    if (ctx.greeting) { if (said) ctx.lastSaid = said; event.amend(ctx.greeting.id, interrupted && said ? said + " —" : null, meta); ctx.greeting = null; return; }
    if (!said) return;
    const a = ctx.attempts.find((x) => !x.used && norm(x.text).startsWith(norm(said))); if (a) a.used = true;
    if (DEBUG) console.log(`brain: played "${said.slice(0, 50)}" matched ${a ? "attempt" : "nothing"}; attempts: ${ctx.attempts.map((x) => (x.used ? "u" : "-") + x.text.length).join(" ")}`);
    ctx.lastSaid = a?.text.trim() || said; ctx.hangupAfter = !!a?.hangup; // "say that again" repeats the whole sentence, not the cut
    const out = event.add(p.id, "voice", "out", interrupted ? said + " —" : said, { ...meta, model: a?.byRule ? "rules" : talker.MOUTH_MODEL, in: ctx.lastIn?.id });
    if (a?.hangup || a?.byRule) return;
    ctx.thinking = ctx.thinking.then(() => talker.think({ person: p, briefing: ctx.briefing })).then((r) => { ctx.briefing = r.briefing; if (r.calls || r.briefing) event.amend(out.id, null, { calls: r.calls, briefing: r.briefing || undefined }); }).catch((e) => console.error("think:", e.message)); },
  close(ctx, reason) { if (ctx.person) console.log(`voice: line with ${ctx.person.handle || ctx.person.id} closed (${reason}) after ${Math.round((Date.now() - ctx.startedAt) / 1000)}s`); },
};
