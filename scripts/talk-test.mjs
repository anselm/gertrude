// A scripted conversation against a scratch database, to watch the talker use its tools. Costs a few cents. Run: node scripts/talk-test.mjs
import { mkdtempSync } from "node:fs"; import { tmpdir } from "node:os"; import { join } from "node:path";
process.env.GERTRUDE_DB = process.env.GERTRUDE_DB || join(mkdtempSync(join(tmpdir(), "gertrude-talk-")), "t.db");
const { person, event, lead } = await import("../lib/store.mjs"); const talker = await import("../lib/talker.mjs");
const p = person.create({ did: "did:plc:testtesttesttesttesttest", handle: "tester", name: "Tess" }); talker.greet(p, "web");
for (const line of ["Hey. Mostly fixing up an old sailboat and trying to find someone who knows diesel engines.", "Yes actually, my neighbour Sam rebuilt a Yanmar last year, and there's a woman at the yard called Priya who runs a rigging shop. Both would like you I think."]) {
  console.log("\nTESS:", line); process.stdout.write("GERTRUDE: "); const out = await talker.reply({ person: p, channel: "web", text: line, onText: (t) => process.stdout.write(t) }); console.log("\n  meta:", JSON.stringify(out.meta));
}
console.log("\nleads:", lead.list(p.id).map((l) => `${l.name} (${l.about}) ${l.invite ? "link" : "no link"}`));
