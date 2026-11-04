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

## What could kill it

- The standalone-app microphone on iOS. If it fails, A degrades to "open Safari to talk", which
  loses the push-to-pickup flow.
- A voice that sounds like a call centre. The persona is most of the product; if TTS cannot carry
  an old lady who pauses, voice waits.
- Latency over 1.5 s. People talk over her and the turn model fights them.
- Carrier labelling on C. Not fatal (B still works, and people can save her number), but it ends
  the "she calls you" ideal on ordinary phones.

## What Anselm has to do before Spike A

Create accounts and drop keys in `/etc/gertrude.env`: LiveKit Cloud (`LIVEKIT_URL`,
`LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`), Deepgram (`DEEPGRAM_API_KEY`), Cartesia
(`CARTESIA_API_KEY`). All three have free tiers. Everything else is code.

## Sources read today

- Anthropic cookbook, low-latency voice with ElevenLabs: https://platform.claude.com/cookbook/third-party-elevenlabs-low-latency-stt-claude-tts
- Claude voice mode is a pipeline (alphasignal, July 2026): https://alphasignal.ai/news/anthropic-s-claude-opus-finally-powers-voice-mode-with-real-tool-access
- LiveKit pricing: https://livekit.com/pricing
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
