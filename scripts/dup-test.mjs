// A repeated message is one message: same cid, or same text within two minutes, gets the same reply. Scratch db; no model call
// is made for the duplicate (the first turn needs the key; without it she answers the resting line, which is fine here).
import { mkdtempSync } from "node:fs"; import { tmpdir } from "node:os"; import { join } from "node:path";
process.env.GERTRUDE_DB = join(mkdtempSync(join(tmpdir(), "gertrude-dup-")), "t.db"); delete process.env.ANTHROPIC_API_KEY;
const { person, event } = await import("../lib/store.mjs"); const talker = await import("../lib/talker.mjs");
const p = person.create({ did: "did:plc:duptestduptestduptestdup", handle: "dup" }); talker.greet(p, "web");
const a = await talker.reply({ person: p, channel: "web", text: "hello there", cid: "c1", onText: () => {} }); const b = await talker.reply({ person: p, channel: "web", text: "hello there", cid: "c1", onText: () => {} }); const c = await talker.reply({ person: p, channel: "web", text: "hello there", onText: () => {} });
const ins = event.recent(p.id).filter((e) => e.dir === "in").length; if (ins !== 1 || a.id !== b.id || b.id !== c.id) { console.error("FAIL", { ins, a: a.id, b: b.id, c: c.id }); process.exit(1); } console.log("dup: 1 in-event for 3 sends, same reply each time");
