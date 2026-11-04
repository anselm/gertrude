#!/usr/bin/env node
// The voice worker: a second process beside the server. `node server/voice.mjs dev|start`. It registers with LiveKit Cloud
// and is handed every new room on the project; the brain decides whether it knows the caller.
import "../lib/env.mjs"; import { fileURLToPath } from "node:url"; import { cli, ServerOptions } from "@livekit/agents"; import { defineVoiceAgent } from "@gertrude/voice/worker"; import { brain } from "../lib/voice-brain.mjs";
export default defineVoiceAgent({ brain, stt: process.env.VOICE_STT || "deepgram/nova-3", tts: process.env.VOICE_TTS || "deepgram/aura-2:athena" });
cli.runApp(new ServerOptions({ agent: fileURLToPath(import.meta.url) }));
