# Spike B: she answers a telephone number

2026-11-04, night. Claude Code session in the gertrude room on servbox. Anselm: "lets sprint on livekit real phone call";
earlier the same evening, "do we use twilio?" (no). Continues `20261104-voice-two-speeds.md` and the voice de-risk entry.
Rests on LiveKit's telephony docs and pricing page read tonight, one headless call presenting a phone number, and a
temp-database run of the caller logic. Point in time.

## Facts that shaped it

LiveKit rents US local numbers itself (one free per project, then a dollar a month; 50 free inbound minutes on the free
plan, then a cent a minute; inbound only, outbound "coming soon"). No trunk provider is needed for inbound, so no Twilio
and no Telnyx yet. A number needs a SIP dispatch rule; LiveKit recommends explicit dispatch to a named agent. A phone
minute all in is around five or six cents: telephony, Nova-3 in, Aura-2 out, and Claude.

Anselm made a fresh LiveKit project named `gertrude` (new key; the companion-intelligence key is dead) and rented
+1 415 908 5505. The dispatch rule "gertrude phone" (`SDR_EDGGX8vFWcZ7`, room prefix `call-`, agent `gertrude`) exists on
that project. The number still has to be attached to the rule in the dashboard; the CLI that does it was an installer
this session was not allowed to run.

## What changed

- **A named agent.** The production worker takes `LIVEKIT_AGENT_NAME=gertrude` from the environment; `roomToken` asks
  for that name by default, so the web ☏ and the SIP rule reach the same worker. Dev workers keep
  `LIVEKIT_AGENT_NAME_OVERRIDE=gertrude-dev`. Tokens can carry participant attributes, which is how a headless caller
  pretends to be a phone.
- **Callers are numbers** (`lib/voice-brain.mjs`). The worker passes `sip.phoneNumber` as `ctx.phone`. A known number
  is the person who owns it (`did tel:<number>`, or a `phone` channel row). An unknown number becomes a provisional
  person with that did and no handle, plus a channel row, so the card has a home. A passkey cannot claim it yet.
- **A different first line for a stranger on the phone:** the disclosure, then "First, though, who sent you my way?"
  instead of "what are you up to". The person block tells her they have no sign-in and no card page yet, so do not
  send them to the web.
- **Leashes.** Strangers: eight minutes a call and three calls a day (`VOICE_STRANGER_MINUTES`,
  `VOICE_STRANGER_CALLS_PER_DAY`); people with a passkey twenty-five minutes (`VOICE_KNOWN_MINUTES`); the web line
  unlimited as before. The worker says a warning thirty seconds out and a closing she cannot be talked out of, then
  closes. Over the daily count she says so and rings off after the greeting. Her own lines are stored with model
  `line` and do not wake the mind. Days turn at roughly midnight Pacific.
- Spoken turns from a telephone carry `phone: true` in the event meta; the channel stays `voice`.

## Checked

Temp database: first call makes the provisional person and asks who sent them; second call gets the short opener;
third call in a day is refused and hangs up; an unknown web identity is still refused. Headless call on the dev
worker with a one-minute leash: stranger opener, mouth first token 0.53 to 0.59 s, the warning at thirty seconds, the
closing at sixty, line closed, events stored with the phone flag. Store tests pass. Not checked: a real telephone,
narrowband audio, and a real caller's pauses.

## To go live

1. Anselm attaches the number to the rule "gertrude phone" in the dashboard (the number's menu).
2. Deploy. Then `LIVEKIT_AGENT_NAME=gertrude` goes into `/etc/gertrude.env` and both units restart; until then the old
   code's web tokens name no agent, so the flip must follow the deploy, not precede it.
3. He calls the number, then someone whose number she does not know calls it.

## Open

- Claiming a telephone card with a passkey later (the merge). The talk-first door for the web is the same work.
- Outbound: wait for LiveKit numbers to dial out; the consent row and the appointment tool come first anyway.
- The transcriber on real phone audio; endpointing against real pauses.
- Spam callers and wrong numbers will arrive once the number is published; the leash is the first answer, a block
  list the second.
