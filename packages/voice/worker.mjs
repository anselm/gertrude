// @gertrude/voice worker: the agent that answers a room. LiveKit Agents does the conversation mechanics (VAD, end of turn,
// interruption, speech in and out through LiveKit Inference); the brain you pass in does the talking. Transcripts only:
// nothing here keeps audio.
//
// brain = {
//   open(ctx)                  -> Promise<{ greeting } | null>   // who is this? null refuses the call. ctx is yours to annotate.
//   respond(text, ctx)         -> AsyncIterable<string>           // one user turn in, text out, streamed
//   spoke(text, info, ctx)     -> void                            // what the person actually heard; info = { interrupted, metrics }
//   close(ctx, reason)         -> void
// }
// ctx = { callId, room, identity, name, channel: "voice", startedAt }
import { defineAgent, voice, inference, llm } from "@livekit/agents";
import * as silero from "@livekit/agents-plugin-silero";
const UNKNOWN = "I'm sorry, I don't know who this is, and I only talk to people I've met. Do sign in on my page first.";
export function defineVoiceAgent({ brain, stt = "deepgram/nova-3", tts = "deepgram/aura-2:athena", language = "en", turnHandling = {}, placeholderLlm = "openai/gpt-5-mini", log = console }) {
  return defineAgent({
    prewarm: async (proc) => { proc.userData.vad = await silero.VAD.load(); },
    entry: async (ctx) => {
      await ctx.connect();
      const participant = await ctx.waitForParticipant();
      const call = { callId: ctx.room.name, room: ctx.room.name, identity: participant.identity, name: participant.name || "", channel: "voice", startedAt: Date.now() };
      const opened = await brain.open(call);
      const session = new voice.AgentSession({
        stt: new inference.STT({ model: stt, language }), tts: new inference.TTS({ model: tts }), vad: ctx.proc.userData.vad,
        // The session insists on an LLM to schedule replies; the brain answers through llmNode below, so this one is never called.
        llm: new inference.LLM({ model: placeholderLlm }),
        // Preemptive generation is off until the brain can take a cancelled turn back; adaptive interruption is a paid knob.
        turnHandling: { preemptiveGeneration: { enabled: false }, ...turnHandling },
      });
      const agent = voice.Agent.create({
        instructions: "(the brain speaks for itself)",
        llmNode: (actx, chatCtx) => { const items = chatCtx.items.filter((i) => i instanceof llm.ChatMessage && i.role === "user"); const text = items.length ? items[items.length - 1].textContent || "" : ""; return brain.respond(text, call); },
      });
      const t0 = Date.now(); const stamp = () => ((Date.now() - t0) / 1000).toFixed(1) + "s";
      session.on(voice.AgentSessionEventTypes.ConversationItemAdded, (ev) => { const it = ev.item; if (!(it instanceof llm.ChatMessage)) return; const text = it.textContent || "";
        if (it.role === "assistant") { const m = it.metrics || {}; log.log(`[${stamp()}] she said${it.interrupted ? " (cut off)" : ""}: ${text.slice(0, 120)}${text.length > 120 ? "…" : ""}  eou=${ms(m.endOfTurnDelay)} ttft=${ms(m.llmNodeTtft)} ttfb=${ms(m.ttsNodeTtfb)}`); brain.spoke(text, { interrupted: !!it.interrupted, metrics: m }, call); }
        else log.log(`[${stamp()}] heard: ${text}`); });
      session.on(voice.AgentSessionEventTypes.UserStateChanged, (ev) => log.log(`[${stamp()}] person ${ev.newState}`));
      session.on(voice.AgentSessionEventTypes.AgentStateChanged, (ev) => log.log(`[${stamp()}] gertrude ${ev.newState}`));
      session.on(voice.AgentSessionEventTypes.Error, (ev) => log.error(`[${stamp()}] error:`, ev.error?.message || ev.error));
      session.on(voice.AgentSessionEventTypes.Close, (ev) => { log.log(`[${stamp()}] line closed: ${ev.reason}`); brain.close(call, ev.reason); ctx.shutdown(); });
      await session.start({ agent, room: ctx.room });
      if (!opened) { await session.say(UNKNOWN, { allowInterruptions: false }).waitForPlayout(); ctx.shutdown(); return; }
      log.log(`[${stamp()}] line open with ${call.identity} (${call.name}) in ${call.room}`);
      session.say(opened.greeting, { addToChatCtx: true });
    },
  });
}
const ms = (x) => x == null ? "-" : Math.round(x * (x < 100 ? 1000 : 1)) + "ms";
