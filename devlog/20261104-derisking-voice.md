# De-risking voice: how Gertrude gets to call you

2026-11-04. Claude (Fable 5.1, room `gertrude` on canada1), from web research done today; my own
knowledge stops in June 2026, so everything dated after that comes from the sources at the end,
most of them vendor pages. Point-in-time. Supersedes the voice findings in
`devlog/20261027-plan-a-digital-person-who-brokers-people.md` where they differ.

## The ask

> I want to derisk voice. I imagine Gertrude calling me on my phone or by an app or something.
> Ordinary phones are so highly controlled as a medium with regulatory issues that it may be hard
> to do that - but that is the ideal. There is a stack of issues here. New tools are released every
> day for low latency communication with ai.

## The three ways she can "call"

| | How the phone rings | Regulation | Cost to build | Risk |
|---|---|---|---|---|
| **A. Web app room** | Web Push "Gertrude would like a word", tap, a WebRTC room opens in the installed web app | None beyond consent; it is an app, not a call | Small; we have push, sign-in and the talker | iOS standalone microphone; the "ring" is a notification, not a ringtone |
| **B. Real phone, inbound** | She has a number; you call her | Light; you called | Small with LiveKit's free US number | Voice quality, latency; the persona in audio |
| **C. Real phone, outbound** | Her number calls yours | TCPA artificial-voice rules; carrier spam labelling | Small in code, medium in process | A call that lands as "Spam Likely"; consent records; a pending FCC rule |
| **D. Native app** | PushKit + CallKit, a true incoming-call screen | None | Large: App Store, Swift, review | Not now |

The ideal he names is C with the feel of D. The plan is A, then B, then C, each one a spike
that retires a risk the next one depends on.

## The stack

**Brain stays ours.** Anthropic still has no speech API: the Claude app's voice mode is a pipeline
around the text model, and the cookbook's voice recipe is STT, Claude, TTS. So the voice is a
cascade around the talker we already have, with its tools, memory and persona. Speech-to-speech
models (OpenAI, Google, Hume, Phonic) are out: the brain would not be Claude and would not have
Gertrude's notes. Kyutai's Unmute is the one open-source cascade worth naming (MIT, any
OpenAI-compatible LLM, about 450 to 750 ms), but it wants a 16 GB CUDA GPU; canada1 is AMD and
the exe.dev VM has none. Not for us yet.

**Transport: LiveKit.** Agents JS (Apache-2) runs in Node, speaks WebRTC to the web app and SIP to
phones, and LiveKit Cloud's free tier covers this whole phase: one US local number, 50 inbound
minutes, 1,000 third-party SIP minutes, 1,000 agent session minutes, 5,000 WebRTC minutes, $2.50 of
inference credit. Paid tiers are $0.01 per agent minute and $0.004 per SIP minute.

**No Anthropic plugin in Agents JS.** Its LLM plugins are OpenAI, Google, Mistral, xAI. We do not
want their LLM plugin anyway: Gertrude's turn is our talker (tools, cached persona block, log).
The job is a small adapter that implements the Agents JS LLM interface by calling our talker and
streaming its text out. I estimate a hundred lines. Python Agents has the Anthropic plugin and more
features, but Node is the house and the talker is Node.

**Ears and mouth.** STT: Deepgram Nova-3 streaming, roughly $0.008 a minute. TTS: Cartesia or
ElevenLabs, both have Node plugins; roughly $0.03 to $0.05 a minute of speech. The voice is a
design problem: an old lady, warm, unhurried, not a clone of anyone. Cartesia and ElevenLabs both
let you design a voice from a description. Turn detection: LiveKit's own end-of-utterance model
plus Silero VAD, both in the Node plugins. Expect 0.7 to 1.1 seconds voice to voice once tuned;
the talker's time to first token is the largest piece we control. A voice turn may want Haiku 5.5
with Sonnet thinking afterwards; measure first.

**All in, roughly $0.05 to $0.10 a minute** at this scale, most of it TTS and the model. The
vendor figures above are from pricing pages read today and not independently verified.

## Regulation, as it stands today

- **FCC 24-17 (February 2024):** an AI-generated voice is an "artificial or prerecorded voice"
  under the TCPA. Calls to mobiles need prior express consent; marketing needs prior express
  *written* consent; the call must identify who is responsible and offer an opt-out. In force.
- **Pending (FCC 24-84, September 2024 NPRM):** would define "AI-generated call" and require
  disclosure at the time of consent and at the start of the call. Reports this year say it is not
  final; one expects Q4 2026 or Q1 2027. Unverified against the FCC itself.
- **Courts:** vendor blogs report a 2026 appeals ruling that the statute needs only prior express
  consent, not written, for artificial-voice calls, and another that vacated the one-to-one consent
  rule. Not verified; do not rely on either.
- **States** add their own disclosure laws. Oregon, California and Idaho matter to us today.

Gertrude's rules already clear the bar as written: she never calls anyone who did not ask her to,
in a logged conversation; she says she is an AI before anything else; she is not selling. The
consent record needs to be a thing we can produce: the line where the person said "call me", with
the number they gave, the time, and the disclosure they heard. That becomes a `consent` row, not a
fact on a card.

**Spam labelling is the practical risk, not the law.** STIR/SHAKEN attestation says the number was
not spoofed; the carriers' analytics decide the label separately from behaviour. Levers for a tiny
caller: one stable number, A-level attestation (a number bought through the carrier, not a
resold trunk, usually gets it), low steady volume, no short calls, register the number with the
Free Caller Registry, and have the called person save the number as a contact (which Gertrude can
ask for in the web app before she ever dials). Branded calling exists but is priced for volume;
not now.

## Spikes, in order

**Spike A, the browser room (first).** The web app gets a "talk to her" button and a push that
opens it. Agents JS worker on the VM; LiveKit Cloud free tier; Deepgram in, Cartesia out; our
talker adapter in the middle. Measures: voice-to-voice latency, whether the microphone survives in
the home-screen app on his iPhone (WebKit bug 226620's last comment, October 2024, says it breaks
in Add-to-Home-Screen apps when backgrounded; iOS 26 had its own microphone bugs; no fix found),
whether the proximity sensor or lock screen kills the call, what the persona sounds like, cost per
minute from the ledger. No regulation touched. Retires the stack risk and the voice risk.

**Spike B, she answers a number.** LiveKit's free US local number routed to the same agent. He
calls it from his phone. Measures: PSTN audio quality (8 kHz narrowband changes how she should
speak), latency over SIP, caller matching (the number on the card, or she asks who it is).

**Spike C, she calls him.** Outbound to his own number with his logged consent. Whether LiveKit's
own numbers can place outbound calls is not clear from the pricing page, which lists outbound
only under third-party SIP; if not, a Telnyx number and trunk (about a dollar a month and under a
cent a minute, unverified). Measures: does it arrive as "Spam Likely" on his carrier, does the
caller name show, voicemail behaviour (voicemail answers as a normal call; needs machine
detection), and the consent row end to end.

**Then decide on D.** If the push-as-ring in A is too weak and C is labelled spam, the honest
incoming-call experience needs a native shell with CallKit. That is a different project.

## The package boundary (Anselm, later the same day)

> It feels like this will be an independent package. If we want a diy solution the stack will be
> a bit more complex such as handling vad.

Yes to the package. The voice layer knows nothing about brokering and Gertrude's brain knows
nothing about audio, so the seam is clean, and matchmaker or any later digital person would want
the same thing. It starts as `packages/voice` in this repo (an npm workspace, never a `file:`
dependency) and moves to its own repo and npm name when it has a second consumer.

The interface is the part to get right now, because it is what lets the engine underneath change.
The package asks its consumer for a **brain** and offers a **session**:

```
brain = {
  greet(ctx)                 -> AsyncIterable<string>   // first words when the line opens
  respond(transcript, ctx)   -> AsyncIterable<string>   // text out, streamed, for one user turn
  interrupted(spokenPrefix)  -> void                    // what she managed to say before barge-in
  end(ctx)                   -> void                    // line closed; ctx has duration, reason
}
ctx = { personId, channel: "web" | "phone", callId, from, to, consentId }

voice.startWorker({ brain, stt, tts, voice, onTranscript })   // runs beside the server
voice.roomToken({ personId })                                  // web app joins a room
voice.call({ personId, to, consentId })                        // outbound, later
voice.on("transcript", ({ callId, who, text, at }) => ...)     // transcripts only, into the log
```

Gertrude's side is small: `greet` and `respond` wrap the talker, `onTranscript` writes `in`/`out`
events with `meta.voice = { callId }` to the same log the web chat uses, so a call and a chat are
one conversation, which was the point from the first plan.

**Engine one is LiveKit Agents JS behind that interface.** It owns the pieces that take months
to make feel natural: Silero VAD, the trained end-of-utterance model, barge-in with transcript
truncation, jitter and packet loss, WebRTC and SIP. We write the brain adapter and the glue. The
package's public surface never mentions LiveKit, so a second engine can replace it.

**What a DIY engine would actually have to carry**, for the record, so the trade is honest:

- Transport: WebSocket PCM from the browser is easy for the web app and useless for phones; PSTN
  means a SIP stack or a carrier's media-stream websocket at 8 kHz mu-law. This alone is why
  LiveKit stays for anything with a number.
- VAD: Silero over onnxruntime-node is a day. Fine.
- Endpointing, the hard one: deciding the person has finished. Silence timers feel robotic, too
  short cuts people off, too long feels deaf. LiveKit and Pipecat both ended up training small
  models on transcript context for this. Deepgram's own endpointing is a usable first cut.
- Barge-in: detect speech during playback, cancel the TTS stream and the model stream, work out
  how much of the sentence was actually heard, and keep the transcript honest about it.
- Echo: the browser's acoustic echo cancellation does this for the web; a raw pipeline over PSTN
  has to trust the carrier's.
- Playback: chunked audio queueing on the client with a cancel path.
- Observability: per-turn timings (speech end, first token, first audio) or latency cannot be
  tuned.

A DIY web-only engine is perhaps two weeks to acceptable and a long tail to good. It is worth
doing only if LiveKit's shape fights us or its cost matters at scale, neither of which we know
yet. The interface above is the insurance; Spike A is the test.

## Second pass (Anselm, same evening): Deepgram, the Android phone, cheap voices

> Livekit seems like a good piece. I feel like piping to Claude is a concern - what if we go to
> deepgram? I do have an ordinary android phone with a real number - in developer mode - does that
> help? Voice output quality is less critical I don't need eleven labs for voice output.

**Deepgram for both ears and mouth.** Yes. Deepgram Nova-3 for streaming STT and Aura-2 for TTS
($0.030 per 1,000 characters, roughly $0.03 a minute of speech) are both in the Agents JS plugin
table, so the vendor list drops to LiveKit and Deepgram. Aura-2 is a plain, clear voice; it will
not do an old lady with character the way a designed ElevenLabs or Cartesia voice would. His call
is that this does not matter yet, and the TTS plugin is one line to swap later.

**Deepgram's own Voice Agent API** is the thing that would replace LiveKit's orchestration rather
than Claude. It is one websocket that does VAD, endpointing, barge-in, STT and TTS, and its
"think" step accepts Anthropic as a provider or any OpenAI-compatible endpoint, with functions
that call back to the client. So Claude stays the brain either way; what changes is who runs the
turn loop. Two reasons not to start there: phones would need a bridge from LiveKit SIP into the
Deepgram websocket that we would write ourselves, and with Deepgram running the loop, Gertrude's
talker (cached persona block, tools, log, thinker) would have to be re-expressed as a Deepgram
prompt plus callbacks, or hidden behind an OpenAI-compatible shim of our own. Behind the package
interface it is a clean engine two if LiveKit disappoints; it is not engine one. Per-minute
pricing for bring-your-own-LLM was not findable on an official page today.

**"Piping to Claude" as a risk.** The pipe itself is not the problem; the talker already
streams. The cost is the time to first token, which is the largest piece of voice-to-voice latency
we control. Mitigations, in order: a short first sentence from the persona ("Well now.") so TTS
starts at once; Haiku 5.5 for voice turns with the thinker on Sonnet afterwards, measured against
Sonnet before deciding; the persona block already cached; and starting TTS on the first clause,
which Agents JS does by default. If after Spike A the first token is still over 800 ms, that is
when to look at Deepgram's hosted think step or a smaller model for the first beat only.

**The Android phone with a real number.** It helps, but not the way one would hope.

- What it is good for: SMS, as planned (SMS Gateway for Android, no 10DLC), and as an *identity*:
  a real mobile number with history that people can save as a contact and that carriers are far
  less likely to label. That is worth a lot for the "she calls you" ideal.
- What it cannot do: hand us the call audio. Android reserves the `VOICE_CALL`, `VOICE_UPLINK`
  and `VOICE_DOWNLINK` capture sources for system apps (`CAPTURE_AUDIO_OUTPUT`); developer mode
  and adb do not change that. adb can dial and answer; it cannot listen or speak.
- Two ways to get a real SIM onto the pipeline anyway, both untested by me:
  1. **An LTE-to-SIP gateway box** (a single-SIM VoIP gateway, in the hundred-to-two-hundred-dollar
     range, I believe; brand and price unverified) with his SIM in it, registered as a SIP trunk in
     LiveKit. Calls then go out and come in on the real number through the same agent as
     everything else. This is the sane version.
  2. **The Bluetooth headset trick**: a Linux box pairs with the phone as a hands-free unit
     (PipeWire's native HFP backend can take the hands-free role, I believe), so the call audio
     arrives as an 8 or 16 kHz SCO stream, and adb places the call. Kludgy, single call at a time,
     and the box has to sit next to the phone; a weekend hack, not a service.
- Either way the carrier's consumer terms may forbid automated calling on that line; read them
  before it carries anything but his own test calls. TCPA applies to the called party regardless
  of where the call originates.

So the phone is the SMS channel and the number people save; for voice it is a possible trunk via
a gateway box, not a media device. Spikes A and B are unchanged. Spike C gains an option: the
gateway with his SIM instead of a bought number, if labelling turns out to bite.

**Keys now needed before Spike A:** LiveKit Cloud and Deepgram only.

## Third pass (Anselm): barge-in, latency, and how the phone rings

> Barge in and low latency are important. Talking to the phone via a call or an app feels good.
> Hmm a signal call? Or Hmm. A native app would do this but it is a pain to make native apps due
> to distribution issues.

**Barge-in and latency are LiveKit's strongest suit**, which is a reason to keep it as engine one.
From its docs today: interruption handling has an `adaptive` mode (a model decides whether the
person is interrupting or just saying "mm-hm", Node SDK 1.2.0 or later) over the fixed
`interruption.min_duration` of 0.5 s; endpointing is `dynamic` with a min and max delay (0.3 to
2.5 s in their samples) driven by the end-of-utterance model; and `preemptiveGeneration` starts
the LLM on the final transcript before the turn is confirmed, so the model's time to first token
hides behind the endpointing delay instead of adding to it. Those three are the whole latency
story for a cascade. Budget to measure in Spike A: speech end to STT final (~200 ms), to first
token (400 to 800 ms, overlapped by preemption), to first audio (~150 ms for Aura-2). Target
under a second voice to voice; under 1.5 s before anyone notices.

**How she rings, option by option.**

| Ring | Real ring? | Distribution | Verdict today |
|---|---|---|---|
| Web app + push | No: a banner with a sound, tap to pick up. Better on Android than iOS | None | Spike A. Every other option shares its agent |
| Ordinary phone call (SIP) | Yes, on any phone | None | Spike C; the spam label is the risk |
| WhatsApp via LiveKit's connector | Yes, through WhatsApp's own call screen | Meta business account and verification; LiveKit access request | **Parked.** Two sources say business-initiated calling is not offered to US business numbers, and permission is a template the person must accept, good for a 72-hour window; unverified against Meta, but enough to stop. User-initiated calls are free and allowed, so "call Gertrude on WhatsApp" could still work later |
| Signal | Would be lovely | No API for calls at all; signal-cli does messages only | Out |
| Native shell | Yes, CallKit on iOS, full-screen notification on Android | TestFlight for iOS (up to 10,000 testers, builds expire after 90 days, lighter review); APK or Play internal testing for Android | The honest answer to "ring like a call" without a carrier. Not a rewrite: Capacitor around the existing web app, plus `@capgo/capacitor-incoming-call-kit` for the call screen and a PushKit plugin for the wake-up. A week or two, plus the Apple paperwork. Decide after A and C |

**A softer answer to the ring.** Gertrude is an old lady. She makes appointments. "Shall I ring
you at four?" turns a push into something close enough to a ring: the person expects it, the
phone is in hand, the banner says "Gertrude, as promised", and one tap opens the line. It costs
nothing, works on every phone today, and it is in character. The nudge dispatcher already has the
timing machinery. Spike A should include it.

So: build A now, with preemption and adaptive interruption on and the timings logged per turn;
then C to learn whether a bought number rings clean; then choose between living with
appointments-plus-push and the native shell. WhatsApp and Signal are off the table for outbound.

## Fourth pass (Anselm): "Why use Deepgram if LiveKit does barge-in?"

Because barge-in and transcription are different jobs, and it turns out LiveKit sells both.
LiveKit's agent framework does the *conversation mechanics*: who is talking, when they stopped,
whether a noise was an interruption, cutting the speech off cleanly. It does not turn sound into
words or words into sound; those are models, and someone has to host them. That was Deepgram's
job in the plan above.

But **LiveKit Inference** hosts those models itself, under the same LiveKit key, with no plugin
and no second account: Deepgram's Nova-3 and Flux, AssemblyAI, Cartesia, Speechmatics for STT;
Deepgram Aura-2, Cartesia, Rime, Inworld, Fish Audio and others for TTS. It works from the Node
SDK (`inference.STT`, `inference.TTS` in `@livekit/agents`), the Build tier includes $2.50 of
credit (about 50 minutes), and the turn-detection and interruption models are free. Prices read
today: Deepgram Nova-3 at $0.0048 a minute, Deepgram Flux (built for conversational turn-taking,
with end-of-turn inside the model) at $0.0065, Aura-2 at $30 per million characters, so about
three cents a minute of speech. Swapping voices or transcribers becomes a string, which is
exactly what we want while we are still finding out what she sounds like.

What Inference does **not** have is Claude. Its LLM list is OpenAI, Google, xAI, DeepSeek, Kimi.
So the shape becomes: LiveKit for transport, turn-taking and the speech models; our own adapter
for the brain. One vendor account instead of two, and the brain stays ours.

**Keys needed before Spike A: LiveKit Cloud only** (`LIVEKIT_URL`, `LIVEKIT_API_KEY`,
`LIVEKIT_API_SECRET`). This supersedes the key lists above.

## What Boardy uses (Anselm asked; answer: not published)

Nothing found names Boardy's vendors: not their site, the Creandum and TechCrunch pieces, the Unio
"voice AI stack" listing, or any vendor case study. What his own experience tells us is still
useful: Boardy placed a real call to his ordinary number first, and when that did not work it
fell back to Google Meet. The first means they run outbound PSTN at volume (one profile says 300
calls a day) and have solved labelling well enough to keep doing it. The second means a meeting
bot: Meet has no API to speak into, so the AI joins as a participant through a headless browser,
which is what Recall.ai, MeetingBaaS and a few others sell, or what you build with Playwright. By
default such a bot joins Meet as an anonymous guest and must be admitted. Which vendor Boardy
uses for either leg is unknown; I would be guessing.

The pattern is worth copying even without the vendors: **phone first, a link second.** For
Gertrude the "link" is her own LiveKit room in the web app rather than a Meet bot, which is
cheaper, under our control, and already in Spike A. A Meet bot stays a possible later fallback
for people who will not install anything and whose carrier blocks her.

## What could kill it

- The standalone-app microphone on iOS. If it fails, A degrades to "open Safari to talk", which
  loses the push-to-pickup flow.
- A voice that sounds like a call centre. The persona is most of the product; if TTS cannot carry
  an old lady who pauses, voice waits.
- Latency over 1.5 s. People talk over her and the turn model fights them.
- Carrier labelling on C. Not fatal (B still works, and people can save her number), but it ends
  the "she calls you" ideal on ordinary phones.

## What Anselm has to do before Spike A

Create a LiveKit Cloud account and drop its keys in `/etc/gertrude.env` (`LIVEKIT_URL`,
`LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`). Speech models come through LiveKit Inference on the same
key (fourth pass below), so no Deepgram account is needed. Everything else is code.

## Sources read today

- Anthropic cookbook, low-latency voice with ElevenLabs: https://platform.claude.com/cookbook/third-party-elevenlabs-low-latency-stt-claude-tts
- Claude voice mode is a pipeline (alphasignal, July 2026): https://alphasignal.ai/news/anthropic-s-claude-opus-finally-powers-voice-mode-with-real-tool-access
- LiveKit pricing: https://livekit.com/pricing and https://livekit.com/pricing/inference
- LiveKit Inference models: https://docs.livekit.io/agents/models/inference.md
- LiveKit outbound calls (Node): https://docs.livekit.io/telephony/making-calls/outbound-calls.md
- LiveKit SIP trunk setup: https://docs.livekit.io/telephony/start/sip-trunk-setup.md
- LiveKit Agents JS repo and plugin table: https://github.com/livekit/agents-js
- LiveKit plugin docs: https://docs.livekit.io/agents/integrations/plugins
- Kyutai Unmute: https://github.com/kyutai-labs/unmute
- Pipecat vs LiveKit vs friends: https://soniox.com/wiki/voice-agent-frameworks and https://www.assemblyai.com/blog/orchestration-tools-ai-voice-agents
- TCPA and AI voice (vendor summaries of FCC 24-17 and 24-84): https://econsent.org/posts/ai-voice-agents-tcpa-rules-october-2026/ , https://www.retellai.com/blog/tcpa-compliance-playbook-voice-ai-outbound , https://ginsburglawgroup.com/2026/02/ai-robocalls-the-tcpa-consent-rules-you-need-to-know/
- Robocalls and STIR/SHAKEN, Congressional Research Service: https://www.congress.gov/crs-product/R48941
- Spam labelling for AI calls: https://www.leadlock.ai/blog/how-to-avoid-getting-tagged-as-spam-likely-for-your-ai-calls/
- Pricing round-ups: https://www.cartesia.ai/learn/deepgram-pricing , https://www.ringlyn.com/blog/ai-voice-agent-pricing-per-minute-2026/
- iOS web app microphone: https://bugs.webkit.org/show_bug.cgi?id=226620 , https://developer.apple.com/forums/thread/802555
- iOS web push and home-screen apps: https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide
