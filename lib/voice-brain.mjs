// Gertrude's brain for the voice package: the talker, on the channel "voice", with the same log as every other channel.
// Opening words are hers to say at once (no model call); a cut-off reply is amended to what was actually heard.
import { randomUUID } from "node:crypto"; import { person as persons, event } from "./store.mjs"; import * as talker from "./talker.mjs"; import { openingLine } from "./persona.mjs";
const LINE_OPENER = "Hello, it's Gertrude. We're on the telephone now, as it were, so I'll keep things short. What's on your mind?";
// A callback producer as an async iterable: chunks arrive through onText, the iterable ends when the promise settles.
function streamOf(run) { const q = []; let wake = null, done = false; const push = (t) => { if (t) q.push(t); wake?.(); wake = null; };
  run(push).catch(() => {}).finally(() => { done = true; wake?.(); });
  return { [Symbol.asyncIterator]() { return { async next() { while (true) { if (q.length) return { value: q.shift(), done: false }; if (done) return { value: undefined, done: true }; await new Promise((r) => (wake = r)); } }, async return() { return { value: undefined, done: true }; } }; } }; }
export const brain = {
  async open(ctx) { const p = persons.byId(ctx.identity); if (!p || p.status !== "active") return null; ctx.person = p;
    const greeting = event.recent(p.id, 1).length ? LINE_OPENER : openingLine(); ctx.lastOut = event.add(p.id, "voice", "out", greeting, { voice: true, call: ctx.callId, opening: true }); talker.warm(p, "voice"); return { greeting }; },
  respond(text, ctx) { return streamOf((onText) => talker.reply({ person: ctx.person, channel: "voice", text, onText, cid: "v-" + randomUUID().slice(0, 12) }).then((out) => { if (out?.id) ctx.lastOut = out; })); },
  spoke(text, { interrupted, metrics } = {}, ctx) { const id = ctx.lastOut?.id; if (!id) return; const m = metrics || {}; const patch = { voice: true, call: ctx.callId, ms: { eou: sec(m.endOfTurnDelay), ttft: sec(m.llmNodeTtft), ttfb: sec(m.ttsNodeTtfb) } };
    if (interrupted) { patch.interrupted = true; event.amend(id, text ? text + " —" : null, patch); } else event.amend(id, null, patch); },
  close(ctx, reason) { if (ctx.person) console.log(`voice: line with ${ctx.person.handle || ctx.person.id} closed (${reason}) after ${Math.round((Date.now() - ctx.startedAt) / 1000)}s`); },
};
const sec = (x) => x == null ? undefined : Math.round(x < 100 ? x * 1000 : x);
