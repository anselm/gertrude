// A person changes their own cadence in conversation; the tool fires, the row changes, the consent carries their words.
import { mkdtempSync } from "node:fs"; import { tmpdir } from "node:os"; import { join } from "node:path";
process.env.GERTRUDE_DB = join(mkdtempSync(join(tmpdir(), "gertrude-set-")), "t.db");
const { person, consent } = await import("../lib/store.mjs"); const talker = await import("../lib/talker.mjs");
const p = person.create({ did: "did:plc:settingstestsettingstes", handle: "ida", name: "Ida" }); talker.greet(p, "web");
process.stdout.write("GERTRUDE: "); const out = await talker.reply({ person: p, channel: "web", text: "Before we go on: I like the idea of you reminding me of things, but once a month is plenty, and never before ten in the morning, I'm not a morning person.", onText: (t) => process.stdout.write(t) });
const q = person.byId(p.id); console.log("\n  meta:", JSON.stringify(out.meta)); console.log("  row:", { nudge_days: q.nudge_days, quiet_from: q.quiet_from, quiet_to: q.quiet_to }); console.log("  consent:", consent.list(p.id).map((c) => c.kind + ": " + c.wording));
if (q.nudge_days !== 30 || q.quiet_to !== 10) { console.error("FAIL: settings not applied"); process.exit(1); } console.log("settings: applied from conversation");
