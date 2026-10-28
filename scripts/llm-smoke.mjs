import * as llm from "../lib/llm.mjs"; process.env.GERTRUDE_DB = "/tmp/gertrude-smoke.db";
const r = await llm.turn({ system: [{ text: "You are Gertrude, an older woman. One short sentence.", cache: true }], messages: [{ role: "user", content: "Hello, who are you?" }], onText: (t) => process.stdout.write(t) });
console.log("\n--", r.stop, r.model, JSON.stringify(r.usage));
