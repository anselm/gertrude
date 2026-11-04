# Spike A: she answers the telephone (in the browser)

2026-11-04, Claude (Fable 5.1, room `gertrude` on canada1), the same evening Anselm sent the LiveKit keys from his
phone. Continues `devlog/20261104-derisking-voice.md`. Built and tested against LiveKit Cloud and the live models with a
headless browser as the caller; **not yet deployed** (the deploy was blocked by the session's permission classifier,
so it waits on Anselm running two commands) and **not yet heard by a human ear**.

## What was built

- `packages/voice/` (npm workspace `@gertrude/voice`, name provisional): `index.mjs` mints a room token for a signed-in
  person; `worker.mjs` defines the LiveKit agent around a **brain** with four functions:
  `open(ctx)` (who is this; the greeting), `respond(text, ctx)` (one turn, text streamed out), `spoke(text, {interrupted,
  metrics}, ctx)` (what was actually heard), `close(ctx, reason)`. Nothing in the package knows about Gertrude.
- `lib/voice-brain.mjs`: Gertrude's brain. `open` finds the person by the token's identity, logs the greeting as a `voice`
  event, and warms the model. `respond` is the talker on channel `voice` with a fresh client id per turn, streamed
  through a small callback-to-async-iterable shim. `spoke` amends the logged reply when she was cut off (the text she
  got out plus a dash, `meta.interrupted`) and records per-turn timings in `meta.ms`.
- `server/voice.mjs`: the worker process (`node server/voice.mjs start`), a second systemd unit `gertrude-voice`
  installed by `deploy/voice-unit.sh`; `deploy.sh` restarts it when present.
- Talker: `VOICE_HOUSE` rules for the voice channel (short turns, no links or spelling, don't re-introduce yourself, let
  a cut-off go); `llm.turn` takes a `model`; `VOICE_MODEL` (default the talker's) for voice turns; `warm()` opens the
  connection and writes the prompt cache while the greeting is still being spoken; dedupe by client id only when one is
  given (a spoken "yes" twice in two minutes is two messages).
- Store: `event.amend(id, text, metaPatch)`.
- Service and server: `voice.token`, `voice.status`.
- Web: `src/lib/line.svelte.js` (one LiveKit room per call, her audio attached, captions from the agent's transcription
  stream, agent state from participant attributes) and a ☏ button beside Send on the talk page; while the line is open
  the composer is replaced by "Line open · 0:42 · she is listening", the last two captions and Hang up. When the line
  closes the transcript reloads and the voice lines appear in it stamped `· voice`.

Speech models come through LiveKit Inference on the LiveKit key: `deepgram/nova-3` in, `deepgram/aura-2:athena` out,
Silero VAD locally in the worker, LiveKit's turn detector and (in dev mode) its adaptive interruption model. Preemptive
generation is **off** because the brain logs a turn when it starts; turning it on needs the brain to take a cancelled
turn back.

## What the test showed

A headless Chrome joined a room with a synthesized caller (Aura-2's Apollo voice, made through the same Inference
endpoint) as its microphone: ten seconds of silence, "Hello Gertrude, it's Anselm, I've been fixing up an old sailboat
and I'm looking for someone who knows diesel engines", twenty seconds, "Actually, never mind the engine, do you know any
sailors around Portland?". Against a scratch database with a short invented history. Three runs.

- The worker registers with LiveKit Cloud in about half a second; a room is answered within a second; the greeting
  plays at once (no model call) with TTS first byte 280 to 430 ms.
- Transcription was right every time ("Ansel" for Anselm, the one slip). Captions streamed to the page word by word.
- **Barge-in works.** The second utterance landed while she was mid-reply; she stopped, the transcript shows her reply
  cut at the word she reached, and the log carries `interrupted: true`. The next reply answered the new question.
- **Latency is the open problem.** Time to first token from the brain, by turn:
  - Sonnet 5.5, no warm: 10.3 s, 2.7 s, 0.9 s
  - Haiku 5.5, no warm: 3.2 s, 1.0 s (and worse sentences: "I have a diesel engine as the thing you need")
  - Sonnet 5.5, warmed at line open: 3.5 s, 1.5 s
  TTS first byte stayed under 200 ms after the greeting. So a settled line is at or near the one-second target and the
  first real turn is not, warm or not. The cause is not established: candidates are the prompt-cache write landing after
  the first turn starts, the server-side-fallback beta's routing, or plain variance across three runs. Measure on the
  live box with real calls before changing anything.
- End-of-turn delay (silence to committed transcript) was about two seconds on the first utterance and near zero on the
  second. Digital silence from a WAV is not a real microphone; judge this on a phone.
- Cost for the three test calls: $0.045 of Claude (Sonnet talk and voice turns, one warm), Inference minutes inside the
  free credit.

## Not verified

- Nothing heard by a human: the voice, its pace, how "athena" carries an old lady (expect: it does not; it is a clear
  professional voice, chosen because he said output quality is not the point yet).
- The iPhone: microphone in the home-screen web app, the proximity sensor, the lock screen. The big unknown from the
  de-risk entry, and only his phone can answer it.
- The talk page's line panel and ☏ button by eye: behind sign-in, so no screenshot. The build compiles.
- A session's end when the browser simply closes: LiveKit reports `participant_disconnected` and the worker shuts the
  job; not observed under a dropped network.

## Next

1. Anselm deploys (`deploy/deploy.sh`, then `deploy/voice-unit.sh` once) and calls her from Safari and from the
   installed app. The worker's journal (`journalctl -u gertrude-voice -f`) shows every turn with its timings.
2. From what he hears: voice choice (one string), endpointing delays, whether to pay for adaptive interruption outside
   dev mode, and the first-turn latency.
3. Preemptive generation once the brain can roll back a turn (log on commit, not on start).
4. "Shall I ring you at four?": the appointment tool and the push that opens the line.
5. Spike B: the free US number routed to the same worker.

## Later the same day: the slow first turn, explained

The ledger had the answer. The warm-up call at line open sent no tools; the real turn sends her tools, and tools sit ahead of
the system prompt in the prompt-cache prefix. So the warm wrote a cache the first turn could not read: the first voice row
shows `cached=0` and a 3.5 s start, the second shows 4056 cached tokens and 1.5 s. Fix: the warm sends the same tools.
Checked on the scratch database: warm, then a first turn with 4056 cached and 1.45 s to first token.

Not Ollama, for the record: the brain is Sonnet 5.5 over the Anthropic API from the start; no local model is in the path.
What remains per turn with a cache hit is roughly end-of-turn detection (0.5–2 s), Sonnet's first token (~1.5 s), Deepgram's
first audio (0.2 s). The next levers, in order: preemptive generation (start the brain on the interim transcript, before the
end of turn is declared; needs the brain to log on commit, not on start), endpointing delays, a rules layer in front for
the shapes that need no model (goodbye, say that again, hold on, STOP, the opener), and Haiku for the shortest turns.
