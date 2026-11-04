// Claude, two ways: `turn` streams a conversational reply (the talker), `complete` returns structured JSON (the thinker).
// Every call lands in the llm_call ledger with tokens and an estimated cost. Models and prices from the claude-api skill,
// 2026-10-27; prices are list, per million tokens, and only for the ledger's estimate.
import "./env.mjs"; import Anthropic from "@anthropic-ai/sdk"; import { llm as ledger } from "./store.mjs";
export const TALKER = process.env.TALKER_MODEL || "claude-sonnet-5-5", THINKER = process.env.THINKER_MODEL || "claude-opus-5-5";
const PRICE = { "claude-sonnet-5-5": [2, 10, 0.2], "claude-opus-5-5": [4, 20, 0.2], "claude-haiku-5-5": [0.1, 0.5, 0.01] };
const cost = (model, u) => { const [i, o, c] = PRICE[model] || [0, 0, 0]; return ((u.input_tokens || 0) * i + (u.output_tokens || 0) * o + (u.cache_read_input_tokens || 0) * c + (u.cache_creation_input_tokens || 0) * i * 1.25) / 1e6; };
let client = null; export const configured = () => !!process.env.ANTHROPIC_API_KEY; const api = () => client || (client = new Anthropic());
const BETAS = ["server-side-fallback-2026-07-01"];
function record(purpose, person, model, msg, ms) { const u = msg?.usage || {}; ledger.add({ purpose, person, model, input: u.input_tokens, cached: u.cache_read_input_tokens, output: u.output_tokens, cost: cost(model, u), ms, stop: msg?.stop_reason || "" }); }
// Safety fallbacks are on by default (skill guidance); if this SDK or account rejects the parameter, retry once without it.
async function withFallbacks(fn) { const base = { betas: BETAS, fallbacks: "default" };
  try { return await fn(base); }
  catch (e) { if (e?.status !== 400) throw e;
    if (/fallback/i.test(e.message || "")) return fn({});
    // A model that never thinks before replying rejects thinking "disabled" and asks for "between_tools" instead.
    if (/between_tools/.test(e.message || "")) return fn({ ...base, thinking: { type: "between_tools" } });
    throw e; } }
// Streamed reply with optional tools. `system` is [{text, cache}] blocks, `messages` alternate user/assistant, `tools` is
// [{name, description, input_schema, run(input) -> string}]. Tool calls run here and the loop continues (at most 3 rounds);
// onText gets each text delta as it streams. Text from every round is concatenated for the stored reply.
export async function turn({ system, messages, onText, tools = [], person = null, purpose = "talk", effort = "low", maxTokens = 600, model = TALKER, signal = undefined, thinking = undefined }) {
  const t0 = Date.now(); const sys = system.map((b) => b.cache ? { type: "text", text: b.text, cache_control: { type: "ephemeral", ttl: "1h" } } : { type: "text", text: b.text });
  const defs = tools.map(({ name, description, input_schema }) => ({ name, description, input_schema, strict: true })); const msgs = [...messages]; let text = "", final = null, calls = [];
  for (let round = 0; round < 3; round++) {
    final = await withFallbacks(async (extra) => { const stream = api().beta.messages.stream({ model, max_tokens: maxTokens, output_config: { effort }, system: sys, messages: msgs, ...(defs.length ? { tools: defs } : {}), ...(thinking ? { thinking } : {}), ...extra }, signal ? { signal } : undefined);
      stream.on("text", (t) => { text += t; onText?.(t); }); return stream.finalMessage(); });
    record(purpose, person, model, final, Date.now() - t0);
    const uses = final.content.filter((b) => b.type === "tool_use"); if (final.stop_reason !== "tool_use" || !uses.length) break;
    const results = []; for (const u of uses) { const tool = tools.find((t) => t.name === u.name); let out; try { out = tool ? String(await tool.run(u.input)) : "no such tool"; } catch (e) { out = "error: " + e.message; } calls.push({ name: u.name, input: u.input, out }); results.push({ type: "tool_result", tool_use_id: u.id, content: out }); }
    msgs.push({ role: "assistant", content: final.content }, { role: "user", content: results }); text += text && !text.endsWith("\n") ? " " : "";
  }
  return { text, stop: final.stop_reason, refused: final.stop_reason === "refusal", model: final.model || model, usage: final.usage, calls, blocks: final.content.map((b) => b.type) };
}
// Structured completion for the thinker: a JSON schema in, parsed JSON out.
export async function complete({ system, user, schema, person = null, purpose = "think", effort = "high", maxTokens = 4000, model = THINKER }) {
  const t0 = Date.now();
  const sys = Array.isArray(system) ? system.map((b) => b.cache ? { type: "text", text: b.text, cache_control: { type: "ephemeral" } } : { type: "text", text: b.text }) : system;
  const msg = await withFallbacks((extra) => api().beta.messages.create({ model, max_tokens: maxTokens, output_config: { effort, format: { type: "json_schema", schema } }, system: sys, messages: [{ role: "user", content: user }], ...extra }));
  record(purpose, person, model, msg, Date.now() - t0);
  if (msg.stop_reason === "refusal") throw new Error("the model declined (" + (msg.stop_details?.category || "refusal") + ")");
  const text = msg.content.filter((b) => b.type === "text").map((b) => b.text).join(""); return JSON.parse(text);
}
