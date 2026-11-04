#!/usr/bin/env node
// The voice worker: a second process beside the server. `node server/voice.mjs dev|start`. It registers with LiveKit Cloud
// and is handed every new room on the project; the brain decides whether it knows the caller.
// Env: LIVEKIT_AGENT_NAME (the worker answers only rooms that ask for this name: web tokens and the SIP dispatch rule do),
// VOICE_STT, VOICE_TTS (LiveKit Inference model strings), VOICE_STRANGER_MINUTES / VOICE_STRANGER_CALLS_PER_DAY / VOICE_KNOWN_MINUTES
// (leashes for telephone callers), VOICE_EOU_MIN / VOICE_EOU_MAX (ms of silence before she
// takes the turn), VOICE_MOUTH_MODEL / VOICE_THINKER_MODEL (see lib/talker.mjs).
import "../lib/env.mjs"; import { fileURLToPath } from "node:url"; import { cli, ServerOptions } from "@livekit/agents"; import { defineVoiceAgent } from "@gertrude/voice/worker"; import { brain } from "../lib/voice-brain.mjs";
const n = (v, d) => (Number.isFinite(+v) && +v > 0 ? +v : d);
export default defineVoiceAgent({ brain, stt: process.env.VOICE_STT || "deepgram/nova-3", tts: process.env.VOICE_TTS || "deepgram/aura-2:theia",
  endpointing: { minDelay: n(process.env.VOICE_EOU_MIN, 450), maxDelay: n(process.env.VOICE_EOU_MAX, 2000) } });
cli.runApp(new ServerOptions({ agent: fileURLToPath(import.meta.url) }));
