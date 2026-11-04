// @gertrude/voice worker: the agent that answers a room. LiveKit Agents does the conversation mechanics (VAD, end of turn,
// interruption, speech in and out through LiveKit Inference); the brain you pass in does the talking. Transcripts only:
// nothing here keeps audio.
//
// brain = {
//   open(ctx)                  -> Promise<{ greeting, hangupAfterGreeting?, maxSeconds?, warning?, closing? } | null>
//                                 // who is this? null refuses the call. maxSeconds caps the call: `warning` is said 30 s before,
//                                 // `closing` at the end, then the line closes. ctx is yours to annotate.
//   respond(text, ctx)         -> AsyncIterable<string>           // a user turn in, text out, streamed. May be called early, on an
//                                                                 // interim transcript, and thrown away: the iterable's return() is
//                                                                 // called and the brain should abort the work behind it. Store
//                                                                 // nothing here.
//   heard(text, ctx)           -> void   (optional)               // the turn is committed: this is what she heard; store it now
//   spoke(text, info, ctx)     -> void                            // what the person actually heard; info = { interrupted, metrics, line }
//                                                                 // line = true when the worker itself said it (a time warning, the closing)
//   close(ctx, reason)         -> void
// }
// ctx = { callId, room, identity, name, phone, channel: "voice", startedAt }. `phone` is the caller's number when the call came
// in by telephone (LiveKit SIP sets the participant attribute sip.phoneNumber), "" from a browser. A brain that sets ctx.hangupAfter = true inside
// respond() gets the line closed once that reply has played (a goodbye).
//
// Turn handling (LiveKit's): preemptive generation is on, so respond() starts on the interim transcript and the end-of-turn
// wait overlaps the model; endpointing is the silence LiveKit waits for before committing (ms).
import { defineAgent, voice, inference, llm } from "@livekit/agents";
import * as silero from "@livekit/agents-plugin-silero";
const UNKNOWN = "I'm sorry, I don't know who this is, and I only talk to people I've met. Do sign in on my page first.";
export function defineVoiceAgent({ brain, stt = "deepgram/nova-3", tts = "deepgram/aura-2:athena", language = "en", endpointing = { minDelay: 450, maxDelay: 2000 }, turnHandling = {}, placeholderLlm = "openai/gpt-5-mini", log = console }) {
  return defineAgent({
    prewarm: async (proc) => { proc.userData.vad = await silero.VAD.load(); },
    entry: async (ctx) => {
      await ctx.connect();
      const participant = await ctx.waitForParticipant();
      const attrs = participant.attributes || {};
      const call = { callId: ctx.room.name, room: ctx.room.name, identity: participant.identity, name: participant.name || "", phone: attrs["sip.phoneNumber"] || "", channel: "voice", startedAt: Date.now() };
      const tOpen = Date.now(); const opened = await brain.open(call); const openMs = Date.now() - tOpen;
      const session = new voice.AgentSession({
        stt: new inference.STT({ model: stt, language }), tts: new inference.TTS({ model: tts }), vad: ctx.proc.userData.vad,
        // The session insists on an LLM to schedule replies; the brain answers through llmNode below, so this one is never called.
        llm: new inference.LLM({ model: placeholderLlm }),
        // Adaptive interruption is a paid knob in production; the VAD mode is what runs there.
        turnHandling: { endpointing, ...turnHandling },
      });
      const agent = voice.Agent.create({
        instructions: "(the brain speaks for itself)",
        llmNode: (actx, chatCtx) => { const items = chatCtx.items.filter((i) => i instanceof llm.ChatMessage && i.role === "user"); const text = items.length ? items[items.length - 1].textContent || "" : ""; return brain.respond(text, call); },
      });
      const t0 = Date.now(); const stamp = () => ((Date.now() - t0) / 1000).toFixed(1) + "s";
      session.on(voice.AgentSessionEventTypes.ConversationItemAdded, (ev) => { const it = ev.item; if (!(it instanceof llm.ChatMessage)) return; const text = it.textContent || "";
        if (it.role === "assistant") { const m = it.metrics || {}; log.log(`[${stamp()}] she said${it.interrupted ? " (cut off)" : ""}: ${text.slice(0, 120)}${text.length > 120 ? "…" : ""}  eou=${ms(m.endOfTurnDelay)} ttft=${ms(m.llmNodeTtft)} ttfb=${ms(m.ttsNodeTtfb)}`); brain.spoke(text, { interrupted: !!it.interrupted, metrics: m, line: [...mine].some((l) => l.startsWith(text.trim().slice(0, 40))) }, call);
          if (call.hangupAfter) { log.log(`[${stamp()}] she rang off`); setTimeout(() => session.close().catch(() => {}), 400); } }
        else { log.log(`[${stamp()}] heard: ${text}`); brain.heard?.(text, call); } });
      session.on(voice.AgentSessionEventTypes.UserStateChanged, (ev) => log.log(`[${stamp()}] person ${ev.newState}`));
      session.on(voice.AgentSessionEventTypes.AgentStateChanged, (ev) => log.log(`[${stamp()}] gertrude ${ev.newState}`));
      session.on(voice.AgentSessionEventTypes.Error, (ev) => log.error(`[${stamp()}] error:`, ev.error?.message || ev.error));
      const timers = []; const mine = new Set(); // lines the worker says on its own account, so the brain can tell them from its replies
      session.on(voice.AgentSessionEventTypes.Close, (ev) => { for (const t of timers) clearTimeout(t); log.log(`[${stamp()}] line closed: ${ev.reason}`); brain.close(call, ev.reason); ctx.shutdown(); });
      await session.start({ agent, room: ctx.room });
      if (!opened) { await session.say(UNKNOWN, { allowInterruptions: false }).waitForPlayout(); ctx.shutdown(); return; }
      log.log(`[${stamp()}] line open with ${call.identity} (${call.name})${call.phone ? " by telephone" : ""} in ${call.room}; open took ${openMs}ms`);
      if (opened.hangupAfterGreeting) { await session.say(opened.greeting, { allowInterruptions: false, addToChatCtx: true }).waitForPlayout(); log.log(`[${stamp()}] she rang off (refused)`); ctx.shutdown(); return; }
      session.say(opened.greeting, { addToChatCtx: true });
      // A capped call: a word of warning, then a goodbye she will not be talked out of, then the line closes.
      if (opened.maxSeconds > 0) { const ms = opened.maxSeconds * 1000;
        const closing = opened.closing || "I must go now, dear. Goodbye."; mine.add(closing); if (opened.warning) mine.add(opened.warning);
        if (opened.warning && ms > 45000) timers.push(setTimeout(() => { log.log(`[${stamp()}] time warning`); session.say(opened.warning, { addToChatCtx: true }); }, ms - 30000));
        timers.push(setTimeout(async () => { log.log(`[${stamp()}] time is up`); try { await session.say(closing, { allowInterruptions: false, addToChatCtx: true }).waitForPlayout(); } catch {} session.close().catch(() => {}); }, ms)); }
    },
  });
}
const ms = (x) => x == null ? "-" : Math.round(x * (x < 100 ? 1000 : 1)) + "ms";
