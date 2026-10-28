// The nudge pipeline end to end on a scratch database: a person with a card and an ntfy channel (a throwaway topic, not
// Anselm's), the thinker proposes (one model call), the operator approves, dispatch delivers outside quiet hours and the log
// shows it. Run: NTFY_TOPIC=<throwaway> node scripts/nudge-test.mjs
import { mkdtempSync } from "node:fs"; import { tmpdir } from "node:os"; import { join } from "node:path";
process.env.GERTRUDE_DB = join(mkdtempSync(join(tmpdir(), "gertrude-nudge-")), "t.db"); process.env.QUIET_FROM = "23"; process.env.QUIET_TO = "0"; process.env.NUDGE_SECRET = "test-secret";
const topic = process.env.NTFY_TOPIC || "gertrude-selftest-" + Math.random().toString(36).slice(2, 8); process.env.NTFY_TOPIC = topic;
const { person, event, card, channel, nudge, lead, invite } = await import("../lib/store.mjs"); const N = await import("../lib/nudge.mjs"); const talker = await import("../lib/talker.mjs");
const fail = (m) => { console.error("FAIL", m); process.exit(1); };
const p = person.create({ did: "did:plc:nudgetestnudgetestnudget", handle: "tess", name: "Tess" }); talker.greet(p, "web");
event.add(p.id, "web", "in", "Mostly fixing up an old sailboat, a 1974 Albin Vega, and trying to find someone who knows Volvo Penta diesels."); event.add(p.id, "web", "out", "A Vega! Who do you know who ought to be talking to me?"); event.add(p.id, "web", "in", "My neighbour Sam rebuilt one last year. Send me a link and I'll pass it on."); const lid = lead.add(p.id, "Sam", "neighbour, rebuilt a Volvo Penta"); invite.make(p.id, lid); event.add(p.id, "web", "out", "Here it is. Send it on and tell me how it went.");
card.set(p.id, { name: "Tess", summary: "Restoring a 1974 Albin Vega in Portland; wants a diesel mechanic.", needs: ["someone who knows Volvo Penta MD-series diesels"], offers: ["sail repair, hand sewing"], interests: ["old boats"], people_in_kind: ["marine diesel people"], facts: [], open_threads: ["whether Sam got the invitation link"], keep_private: [], tone: "direct, practical" }, event.lastId(p.id));
// a second person whose card offers what Tess needs, so the circle-in-kind line has something
const q = person.create({ did: "did:plc:nudgetestnudgetestother", handle: "sam2", name: "Rhea" }); card.set(q.id, { name: "Rhea", summary: "Marine mechanic.", needs: [], offers: ["rebuilds small marine diesels, Volvo Penta and Yanmar"], interests: [], people_in_kind: [], facts: [], open_threads: [], keep_private: [], tone: "" }, 0);
if (N.eligible(p) !== "no channel") fail("should need a channel: " + N.eligible(p)); channel.add(p.id, "ntfy", { server: "https://ntfy.sh", topic }, "ntfy"); if (N.eligible(p) !== null) fail("should be eligible: " + N.eligible(p));
console.log("proposing (one Opus call)…"); const r = await N.propose(p.id); if (!r.nudge) fail("no proposal: " + r.skipped); console.log("PROPOSED", r.nudge.kind, "—", r.nudge.text, "\n  reason:", r.nudge.reason);
if (/\bRhea\b/.test(r.nudge.text)) fail("named a third party"); if (N.eligible(p) !== "one pending") fail("should block while pending");
if (!N.checkSig(r.nudge.id, "approve", N.sign(r.nudge.id, "approve")) || N.checkSig(r.nudge.id, "approve", "nope")) fail("signature check");
N.decide(r.nudge.id, "approve"); const sent = await N.dispatch(); if (sent !== 1) fail("dispatch sent " + sent); const n = nudge.get(r.nudge.id); if (n.state !== "sent") fail("state " + n.state);
const last = event.recent(p.id, 1)[0]; if (!(last.dir === "out" && last.channel === "ntfy" && last.text === n.text)) fail("log missing: " + JSON.stringify(last));
if (!/nudged within/.test(N.eligible(p) || "")) fail("cap not applied: " + N.eligible(p)); person.setNudgeDays(p.id, 0.25); console.log("nudge: proposed, approved, delivered to ntfy topic", topic, "and logged; cap holds; per-person interval settable");
