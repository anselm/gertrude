// Store and talker-history checks against a scratch database. Run: npm test
import { mkdtempSync } from "node:fs"; import { tmpdir } from "node:os"; import { join } from "node:path";
process.env.GERTRUDE_DB = join(mkdtempSync(join(tmpdir(), "gertrude-")), "t.db");
const { person, event, card, consent, lead, invite, edge, vouch } = await import("../lib/store.mjs"); const { history } = await import("../lib/talker.mjs");
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error("FAIL", m); process.exit(1); } };
const p = person.create({ did: "did:plc:abcdefghijklmnopqrstuvwx", handle: "test" }); ok(person.byDid(p.did).id === p.id, "create/find");
event.add(p.id, "web", "out", "Hello, I'm Gertrude."); event.add(p.id, "web", "in", "hi"); event.add(p.id, "sms", "in", "still me"); event.add(p.id, "web", "out", "I know, dear.");
const h = history(event.recent(p.id)); ok(h[0].role === "user" && h[0].content.includes("arrived"), "history starts with user"); ok(h[2].role === "user" && h[2].content.includes("[now on sms]"), "channel change marked: " + JSON.stringify(h)); ok(h.length === 4, "merged turns " + h.length);
card.set(p.id, { summary: "x" }, 2); ok(card.get(p.id).summary === "x", "card"); ok(card.stale(0).length === 1, "stale when log moved past card"); card.set(p.id, { summary: "y" }, event.lastId(p.id)); ok(card.stale(0).length === 0, "fresh");
consent.add(p.id, "text", "yes", "web"); ok(consent.list(p.id).length === 1, "consent");
const lid = lead.add(p.id, "Sam", "diesel mechanic"); const tok = invite.make(p.id, lid); ok(invite.get(tok).lead_name === "Sam", "invite carries lead name"); ok(lead.list(p.id)[0].invite === tok, "lead has link");
const q = person.create({ did: "did:plc:zyxwvutsrqponmlkjihgfedc", handle: "sam" }); ok(invite.use(tok, q.id)?.by === p.id, "invite used"); ok(invite.use(tok, q.id) === null, "invite single use"); ok(lead.list(p.id)[0].arrived && lead.list(p.id)[0].arrived_name === "sam", "lead arrived"); ok(edge.of(p.id).length === 2 && edge.count() === 2, "edge made (invited and vouched)"); ok(vouch.given(p.id).length === 1 && vouch.given(p.id)[0].via === "invite", "invitation is a vouch"); ok(vouch.add(p.id, q.id, "link") === null, "one vouch per pair"); ok(person.byHandle("SAM")?.id === q.id, "handle lookup, any case");
person.remove(q.id); ok(edge.of(p.id).length === 0, "edge cascades"); person.remove(p.id); ok(!person.byId(p.id) && event.recent(p.id).length === 0 && !card.get(p.id), "delete cascades");
console.log(`store: ${n} checks pass`);
