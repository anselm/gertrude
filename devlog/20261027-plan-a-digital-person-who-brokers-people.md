# 2026-10-27 · Plan: Gertrude, a digital person who brokers people

Point-in-time plan, written for sign-off before any code. Revised the same evening
after Anselm said Twilio had been "extremely challenging" to integrate for the
litahotel.com concierge, where he ended up plugging an ordinary Android phone into the
network; the voice and SMS shapes below now keep Twilio off the critical path. Supersedes the empty
milestones in `20261027-init.md`. Prices and product facts below were read from
vendor pages on 2026-10-27 and will drift; anything marked *unverified* came from
one secondary source or could not be confirmed.

## Grounding

**The ask** (Anselm, 2026-10-27, in the gertrude room, quoted in full because it is
the brief):

> I want to write a digital person service that will connect people to each other. I
> want to specify this service with you and then write it. It will need to be spun up
> as an exe.dev instance and we will use anthropic credits for it to start since it
> will rely heavily on an llm. This idea is inspired by https://www.boardy.ai/ but the
> goal is to connect ordinary people to each other over complementary interests - not
> just executives and talent... this is consumer to consumer, to help communities
> broker relationships, in a sense a kind of gossip network facilitator or social glue.
>
> + she will be a digital person, an old lady, with a name like hazel, pearl, dorothy,
>   lillian or mabel, edith or Gertrude - something that really says 'older'.
> + the service as a whole will be a brokerage, it will find out peoples needs, attempt
>   to trace out a social graph of extremely high quality connections between people
>   and matchmake them over complementary interests
> + unlike my previous projects she will be proactive, she will be building a list of
>   high quality people that are connected to each other, seeded by me or other network
>   anchors (ala avogado).
> + for fresh contacts she will introduce herself, and ask people what they need. with
>   permission she will call people back again. she will behind the scenes attempt to
>   match make people over complementary interests. we should mention a few things on
>   fresh connections, such as we're mostly wanting to focus on public information, not
>   private - this is a public service. also the project is open source and open
>   participation, anybody can help make her better and wiser.
> + she will primarily be a voice agent, although i think she will need a google meetup
>   room, and an ability to use sms, and other conventional gateways that a real person
>   uses. we will also have a web page - we can use attest.monster for authentication.
> + she has to have a deep conceptual context - for example when i was talking to
>   boardy we were disconnected a few times, switched between phone, sms and google
>   zoom - and boardy never lost context; it didn't spin up two separate agents to talk
>   to me - it was very much like a real person.
> + we need high quality full duplex voice https://block.xyz/dessa is one solution;
>   there may be other solutions.
> + what other criteria are there? you may need to build a list of criteria
> + how do we break this into milestones and deliverables? what is an mvp?
> + i have started using nfty.sh/<his topic> - we can use that.
> * lets make a plan, devlog it, and then i will sign off and we can make a prototype

**Agent and session:** Claude Code (Fable 5.1) on servbox, tmux room `gertrude`,
session https://claude.ai/code/session_018TGCFjehHmLRJQ7VxE3JRW. Three research
subagents ran in that session (voice stacks; Boardy and prior art; telephony, SMS,
Meet and US compliance). Their reports are condensed here; the raw transcripts live
only in the session's scratchpad and are not kept.

**Rests on:** the matchmaker devlogs on the intro object and bounties
(`~/projects/2027/matchmaker/devlog/20260916-*`, `20261009-*`), attest's identity and
agent model (`~/projects/2027/attest/devlog/20261007-agents.md`), the harness ntfy
notes (`harness/private/ntfy.md`), and the sources linked inline.

## 1. What she is

Gertrude is one person with many mouths. People meet her on the phone, by text, on a
web page, in a call room. Behind every channel is one memory of each person and one
running conversation with them. She asks people what they need and what they can
give, keeps a card on each of them that they can read and correct, and when two cards
fit she asks both sides whether they want to meet. Nothing is sent until both say yes.

She is proactive but not cold. She never dials a stranger. A person reaches her first,
or a named anchor (Anselm, then others) gives her a name and the person confirms by
text before she ever rings. Then, with permission, she calls back.

She tells people what she is on every first contact: an AI, run by Anselm as a public
service, open source, mostly interested in what people are happy to have known.

**Name.** The project is already `gertrude` and the name says old. Recommendation:
keep Gertrude. The alternatives he listed stay in the persona file as names she might
mention as sisters or friends, which is cheap colour.

**"ala avogado" is Advogato** (Anselm, by screenshot, the same evening): Raph Levien's
1999 community site and its attack-resistant trust metric. Members certified each
other (observer, apprentice, journeyer, master); trust was computed as a flow from a
small seed set through those certifications, so an attacker who creates any number of
fake accounts can only draw the bounded capacity of the real accounts that certified
them. For Gertrude that means: **anchors are the seed set.** A person is in her graph
only if trust flows to them from an anchor through vouches, and how much she will do
for them (how many intros, whether she calls back, whether they can vouch others)
scales with that flow. Attest already states its scoring the same way, "trust by flow
from a root through vouches", with Jake Hartnell's Trustgraphs noted as the scoring
layer; so anchor certifications are attest vouch records and Gertrude asks attest for
flow from the anchor set rather than computing trust herself. Levien's metric is
described in his thesis "Attack-resistant trust metrics" (UC Berkeley; written from
memory, title to be confirmed when the reference is catalogued).

## 2. What was learned

### Boardy (the model to learn from and diverge from)

- Persona "superconnector", no app, no dashboard, no login; an app would "break the
  magic". Channels now: phone, WhatsApp, iMessage, LinkedIn, X, email, calendar, and it
  joins Meet, Zoom and Teams. Double opt-in on every intro: "Nothing sends until you
  do." (https://www.boardy.ai/, https://techcrunch.com/2024/10/24/ai-networking-startup-boardy-raises-3m-pre-seed/)
- Seeded from the founder's own network, "a few thousand" people at launch; no vouching
  or referral mechanic found. Free tier capped at three intros a day; Pro $100/month
  (secondary source). (https://blastra.io/blog/boardy-ai-networking-guide/)
- Their own numbers (Sep 2026): about 237k people, about 1,500 intros a day, about 20%
  of intros lead to a meeting both sides found useful; they track attempted, both-yes,
  met, useful, no-show. (https://www.eomag.io/article/boardy-launching)
- The continuity Anselm noticed: the team describes an "amorphous" per-person profile
  carried across channels and says contextual memory and two-sided matching are the
  hard problems; they accept extra voice latency for depth.
  (https://consumerstartups.substack.com/p/boardy-your-ai-co-founder)
- Framing worth copying: Boardy "works for himself", not for the asker, and may
  decline. Failure worth remembering: the Jan 2025 unsolicited LinkedIn-photo emails
  and the founder's apology. Voice vendor never disclosed.

### Prior art, in one line each

Lunchclub (a16z, weekly algorithmic video intros) lost retention and pivoted to
crypto; Shapr (swipe networking) shut in 2023; Intros.ai survived only as a tool for
community operators and was acquired by Bevy; Donut pairings go stale when prompts are
ignored; Front Porch Forum (Vermont) is the civic success and runs on slow cadence,
human moderation and small geography. Pattern: feeds and swipes fail; value survives
where there is an existing community, a curator with a quality bar, or a real event.
Weak-tie research (Granovetter; the 2022 LinkedIn experiment in Science) says
moderately weak ties across circles produce the most movement, not the weakest.

### Voice: the one hard constraint

**Anthropic has no speech or realtime-audio API.** The Claude API takes text, images
and PDFs (https://platform.claude.com/docs/en/build-with-claude/overview). So the
brain is Claude over text, and speech is speech-to-text and text-to-speech wrapped
around it. Every speech-to-speech model is out by the "Anthropic credits" constraint:

- **Dessa (Block)** is a full-duplex speech model announced 2026-10-23, trained on
  speech alone, no external LLM, no weights, no API, no license, waitlist only, runs
  on an M4 Max class machine (https://block.xyz/dessa,
  https://techcrunch.com/2026/10/24/blocks-new-voice-model-sounds-eerily-human/).
  Watch it; cannot build on it.
- OpenAI Realtime and Gemini Live: not Claude. Kyutai Unmute/Moshi: open but need a
  16 to 24 GB GPU and have no telephony. Hume EVI shuts down 2026-11-13.

What remains is a cascade: streaming STT, Claude, streaming TTS, with voice activity
detection and a turn model handling interruption. Four workable shapes:

| Shape | Who runs the audio | Claude | Phone | Own web room | Cost beyond Claude |
|---|---|---|---|---|---|
| Twilio ConversationRelay | Twilio (STT, TTS, barge-in); we get text over a websocket | yes, our code | native | no | $0.07/min + $0.014/min voice (dropped after his Twilio experience) |
| Pipecat (Python, BSD) on our VM | us; Silero VAD + Smart Turn on CPU | first-party Anthropic service | Twilio or Telnyx media streams | yes (Daily or WebRTC) | STT ~$0.005, TTS $0.03–0.08, voice $0.014 /min |
| LiveKit Agents (Apache-2) + LiveKit Cloud | us (worker) + LiveKit (rooms, SIP) | first-party plugin (Python verified; Node SDK exists, its Anthropic plugin *unverified*) | SIP trunk via Twilio/Telnyx | yes | free 1,000 min then $0.01/min + pieces |
| Vapi / Retell / ElevenLabs Agents | them | yes, Claude selectable | yes | partly | $0.05–0.08/min platform + pieces |

Sources: https://www.twilio.com/docs/voice/twiml/connect/conversationrelay,
https://docs.pipecat.ai/server/services/llm/anthropic,
https://docs.livekit.io/agents/integrations/llm/anthropic/, https://livekit.com/pricing,
https://vapi.ai/pricing, https://www.retellai.com/pricing, https://elevenlabs.io/pricing/agents.

**No product surveyed carries one conversation across phone, SMS and a meeting.** That
property is ours to build and is the strongest reason to own the orchestration and the
transcript rather than rent a platform where the transcript lives in their account.

**The voice itself.** ElevenLabs has officially labelled grandmother voices ("The
Gentle Matriarch", late 70s; "Grandma Titina"), Voice Design from a text prompt, and
v3 tags for laughs and sighs (https://elevenlabs.io/voice-library/grandmother). Rime
Coda has an "Elder" tier (`esther`, `prentiss`) and Mist v3 `pearl`, "wise older
American voice", at $0.03–0.05/min with 37 ms time to first audio
(https://docs.rime.ai/docs/voices-coda.md). Inworld TTS-2 has the best breath and
chuckle control but no age catalogue. Pick by ear, not by description.

### Google Meet

Google's Meet Media API is receive-only, developer preview, and the overview page says
it is no longer accepting signups (*one fetch; unverified*). The only way to speak in a
Meet is a headless-browser bot: Recall.ai Output Media ($0.50/recording hour, first
5 h free), or open-source Attendee or Vexa self-hosted. All fragile. The realistic
answer is that Gertrude hosts her own room (LiveKit or Daily, both with free tiers)
and sends the link, and a Meet bot is a later add-on if people insist on Meet.

### Telephony and SMS, as an individual in the US

- Twilio: $0.014/min out, $0.0085 in, $0.0083/SMS, $1.15/month a number; no regulatory
  bundle for US numbers. Telnyx is roughly half the price per minute but requires
  identity verification before buying a number. (https://www.twilio.com/en-us/voice/pricing/us,
  https://telnyx.com/pricing/voice-api)
- **A2P 10DLC is mandatory for texting from a carrier-API number** and a sole
  proprietor can register: $4 brand, $15 campaign vetting, $2/month, one number, about
  1,000 segments a day, two to three business days review. Unregistered texts are
  blocked and billed. (https://www.twilio.com/docs/messaging/compliance/a2p-10dlc)
  A real SIM in a real phone is outside 10DLC entirely, which is why the plan now texts
  from an Android phone (see Architecture). Note that her voice number (LiveKit) and
  her text number (the SIM) will differ unless the SIM's number is ported or forwarded;
  she simply tells people "call me on this one, text me on that one", which is what a
  person with a landline and a mobile does.
- iMessage needs an Apple-approved provider and a live human agent; RCS is business
  vetting with carrier fees; Signal has no bot API. WhatsApp Business is possible
  (24-hour reply window, templates outside it) but needs a Meta business account.
  Phone plus SMS plus web is the honest channel set for a start.

### Law, condensed to what we will do

The FCC ruled in Feb 2024 that AI voices are "artificial" under the TCPA, so every call
she places is a robocall that needs prior consent (https://www.fcc.gov/document/fcc-makes-ai-generated-voices-robocalls-illegal).
California, Utah, Maine and New York require bot disclosure in various forms; Oregon
SB 1546 (companion chatbots, effective 2027-01-01, $1,000 statutory damages,
*signing unverified*) is why she must never be framed as a companion. Recording consent
is all-party in a dozen states and we cannot know where a callee is. A repeated remark
about a named neighbour is defamation exposure a small project cannot defend the way
OpenAI did in Walters.

Rules, each of which becomes code or persona text:

1. Inbound first. Outbound only to a person who gave their number and said yes in
   writing (web form, "YES" by text, or email); the consent is logged with wording and
   time.
2. First sentence of every call and first text of every thread: her name, that she is
   an AI, who runs her, and a number to call back.
3. Calls only 08:00–21:00 in the callee's local time, Pacific when unknown.
4. "Stop", in any wording, on any channel, stops all channels at once and goes on a
   do-not-contact list kept five years.
5. No audio recordings. Transcripts only, and she says "I take notes." This also keeps
   voiceprints, a biometric, out of the system.
6. Nothing said about a third party is repeated. She will say "Anselm thought you two
   should talk" only if Anselm said so about himself as the introducer; hearsay about a
   person never appears in intro text.
7. Per-person "keep private" list and a one-message delete-everything path; retention
   measured in weeks for raw transcripts, with the card kept only while the person
   is active.
8. Adults only, vouched by an anchor or by someone trust flows to from an anchor. No companion framing, ever.
9. 10DLC registration, STOP and HELP handlers, STIR/SHAKEN A attestation and Free
   Caller Registry on day one, low steady volume to warm the number.

## 3. Criteria

Beyond the brief, these are the properties the design is judged against. Each has a
way to check it.

| # | Criterion | How we check |
|---|---|---|
| 1 | **Continuity.** One conversation per person across channels; a dropped call resumes by text or callback with no re-introduction | Scripted test: call, hang up mid-sentence, text; she picks up the thread |
| 2 | **Consent before contact.** No outbound without logged consent; disclosure on every first contact | Consent row required by the dialer; persona test suite |
| 3 | **Full duplex.** Barge-in within about 300 ms, backchannels ("mm-hm") do not interrupt her, no talking over | Measured on test calls; Anselm's ear |
| 4 | **Latency.** First audio within about one second of the person stopping | Logged per turn: STT end, first token, first audio |
| 5 | **Persona constancy.** Same voice, same name, same manner on every channel; never claims to be human | Persona file is the single source; red-team prompts |
| 6 | **Public by default, said so.** People know what is kept and can see their own card | Web card page with edit and delete; the opening script |
| 7 | **Intro quality over volume.** Double opt-in, a daily cap per person, measured funnel (proposed, both yes, met, useful) | Admin page counters; a rule whose "useful" rate falls under a floor is switched off |
| 8 | **Bridging, not clustering.** Prefer intros across circles | Edge source recorded; matcher scores cross-anchor pairs higher |
| 8a | **Advogato seeding.** Everything she does for a person is bounded by trust flow from the anchor set; fake or spammy people cannot pull more than their certifiers' capacity | Flow computed from attest vouches; limits per level in config |
| 9 | **Human in the loop at first.** Every outreach plan and every intro is approved by Anselm until the funnel earns autonomy | ntfy push with approve and decline actions; nothing sends without it |
| 10 | **Open source, open participation.** Persona, matching rules and docs in the public repo; contributions are prompt and rule changes anyone can read | Public repo, MIT like attest (his call) |
| 11 | **Observability.** Every turn, tool call, cost and consent is in one log Anselm can read from the phone | Admin page behind attest; ntfy for events |
| 12 | **Cost ceiling.** Known cost per minute and per intro; a monthly cap that stops outbound when hit | Ledger table like matchmaker's `llm_calls`; cap in config |
| 13 | **Graceful failure.** Carrier down, model slow, STT garbage: she says so briefly and offers text | Chaos tests on the pipeline |
| 14 | **Abuse resistance.** People using her to harvest others' details, to prank-call, or to impersonate | Third-party rule above; per-caller rate limits; anchors can be revoked |
| 15 | **Identity resolution.** Phone, SMS, web (attest) and room link resolve to one person without a login | Binding flow: she texts a code; attest DID bound to the number |
| 16 | **Portability.** Store and channels behind interfaces so Twilio, the TTS vendor or the model can be swapped | House modular policy; one `store` module; channel adapters |

## 4. Architecture

Modular per house policy: small ES modules, formal interfaces, one store.

```
      web chat + card (attest, M1)  email (M2)  voice: browser room / LiveKit number (M5)  SMS: Android phone (M6)
                        │                  │                   │                    │
                 ┌──────┴──────────────────┴───────────────────┴────────────────────┴──────┐
                 │                 channel adapters  →  events on the bus                  │
                 │   {person, channel, direction, text, ts, meta}   (orbital bus pattern)  │
                 └──────────────────────────────┬───────────────────────────────────────────┘
                                                │
        ┌────────────────────┐        ┌─────────┴──────────┐         ┌──────────────────────┐
        │  talker (live)     │◄──────►│  conversation store │◄───────►│  thinker (offline)   │
        │  per-turn Claude   │        │  one log per person │         │  after each contact: │
        │  call, streamed,   │        │  + card + consent   │         │  update card, extract│
        │  persona + card    │        │  + edges + intros   │         │  needs/offers, match,│
        │  + recent log      │        │  (SQLite, 1 module) │         │  plan outreach       │
        └────────────────────┘        └─────────┬──────────┘         └──────────┬───────────┘
                                                │                               │
                                      ┌─────────┴──────────┐          ┌─────────┴───────────┐
                                      │  web: card, admin  │          │  approvals: ntfy    │
                                      │  (Fastify+socket.io│          │  push with actions  │
                                      │   attest sign-in)  │          │  → Anselm's phone   │
                                      └────────────────────┘          └─────────────────────┘
```

**The continuity trick.** The voice session is ephemeral; the conversation is not.
Every utterance on every channel is appended to one log per person. The talker's
Claude context is assembled fresh on each turn from the persona, the person's card,
open threads (an unanswered question, a pending intro) and the tail of the log,
regardless of which channel the turn came in on. When a call drops she notices the
hangup event, and if the consent allows she texts: "We got cut off. Call me back, or
just answer here." The next message, on either channel, continues the same log. That
is what Boardy felt like and it costs nothing but discipline about where state lives.

**Two brains.** The talker runs on every turn and must be fast: Claude Sonnet 5.5
(`claude-sonnet-5-5`, $2/$10 per million tokens) with prompt caching on the persona
and card, effort low; Haiku 5.5 (`claude-haiku-5-5`, $0.10/$0.50) is the fallback if
Sonnet's first token is too slow on the phone, measured not assumed. The thinker runs
after each contact and nightly, and can be slow and careful: Claude Opus 5.5
(`claude-opus-5-5`, $4/$20). It rewrites the card with quotes as provenance, extracts
needs and offers, scores pairs, drafts intro blurbs for each side, and proposes the
next outreach. Server-side fallbacks on for refusals.

**Identity.** The phone number is the key for voice and SMS. The web card signs in
through attest (passkey, the matchmaker pattern) and is bound to the number by a code
she texts. A room link carries a per-person token. One `person` row, many
`identities`.

**Anchors.** Anselm, then named others, are the seed set. An anchor vouches a person
(an attest vouch record, signed by the anchor's passkey); Gertrude texts that person
for consent before any call. Vouched people may vouch in turn, and flow attenuates
with each step, Advogato-style. Her per-person caps (calls back, intros a day, may
vouch) are read from the flow, so the graph grows from the inside and stays hard to
spam.

**Proactivity with a leash.** The thinker writes an outreach plan (who, why, when, what
she will open with). The plan goes to Anselm as an ntfy push with Approve and Decline
actions (ntfy supports up to three action buttons on a message; the public topic is
guessable, so the topic gets a random suffix as the harness note already suggests, and
approve links carry a signed one-time token). Approved plans are dialed inside quiet
hours. Intros work the same way: both parties' yes, then Anselm's, then she sends.
Autonomy is granted per rule when its measured funnel earns it.

**Data model** (store module, SQLite via `node:sqlite` as in attest):

- `person` {id, name, created, anchor_id, status}
- `identity` {person, kind: phone|email|attest_did|room_token, value, verified_at}
- `consent` {person, kind: call_back|text|share_card|public, wording, channel, at, revoked_at}
- `event` {person, channel, direction, text, ts, meta} — the one log
- `card` {person, needs[], offers[], interests[], facts[{text, quote, public}], updated}
- `edge` {a, b, how, strength, source} — who knows whom, from what evidence
- `intro` {a, b, blurb_a, blurb_b, state: proposed|a_yes|b_yes|approved|sent|met|useful|declined, by, at} — matchmaker's intro states, extended with the operator approval
- `plan` {person, kind: first_call|call_back|intro_ask, reason, window, state, approved_by}
- `dnc` {value, kind, at, wording}
- `llm_call` {at, model, tokens_in, cached, tokens_out, cost, purpose}

**Relationship to matchmaker and attest.** Attest is sign-in and, later, vouches
(anchors vouching people is exactly a vouch record). Matchmaker already has an intro
object with soft settlement and bounties; Gertrude adopts its states and vocabulary so
the two can share records later, but keeps her own store now. Whether she is a new
front door to matchmaker's brokerage or a sibling with its own graph is his call; the
plan assumes sibling.

**Stack.** Node ES modules, Fastify, socket.io for the browser, SQLite, one exe.dev VM
(`gertrude`), systemd units for web and thinker, deploy by `deploy/deploy.sh` (push is
not deploy). Secrets in `/etc/gertrude.env` on the VM and in the harness private notes.

**Voice shape for the MVP: LiveKit Agents, Node, on our VM, with LiveKit Cloud for
rooms and the phone number.** The first draft of this plan put Twilio on the critical
path twice (ConversationRelay for voice, 10DLC for SMS). Anselm's litahotel.com
experience says no. LiveKit removes Twilio entirely:

- `@livekit/agents` with `@livekit/agents-plugin-anthropic` is a real Node package
  (docs show `new anthropic.LLM({model})` inside a `voice.AgentSession`,
  https://docs.livekit.io/agents/models/llm/anthropic/). STT and TTS are plugins
  (Deepgram, ElevenLabs, Rime, Cartesia); Silero VAD and the `v1-mini` turn detector
  run on CPU.
- LiveKit Cloud's free Build plan includes one US local phone number with 50 inbound
  minutes, 1,000 third-party SIP minutes and 1,000 agent-session minutes; paid tiers
  are $0.01/agent-minute and $0.004/SIP-minute (https://livekit.com/pricing, read
  2026-10-27). So M1 needs no carrier account at all. When volume grows, a SIP trunk
  from Telnyx or voip.ms plugs into the same inbound trunk config; still no Twilio.
- The same worker serves the browser room, so M4's "her own room" is the same code
  with a different participant, not a second stack.
- The worker is one Node process on the exe.dev VM; LiveKit's own sizing note is
  about 3.8 cores and 2.8 GB for 30 concurrent sessions, so a handful is fine.

Caveats, to be settled by the M1 spike: LiveKit's better turn model runs only on their
inference service (the CPU `v1-mini` may be good enough); self-hosting the SIP part
alongside LiveKit Cloud is unsupported per their community, so phone comes through
their cloud SIP, which is fine at this scale; the Node SDK lags the Python one, and if
a plugin we need is Python-only the voice worker becomes a Python process beside the
Node brain, with the talker, store and adapters unchanged. Pipecat stays the second
fallback. Twilio ConversationRelay is now the last resort, not the plan.

**The Android phone, considered properly.** For SMS it is the right tool: capcom6's
SMS Gateway for Android (Apache 2.0, https://github.com/capcom6/android-sms-gateway)
turns a phone with a SIM into an HTTP API with webhooks, and its "private server" mode
lets the phone connect out to a server we run on the gertrude VM, so the phone can sit
on his network. A consumer SIM texting at human volume is person-to-person traffic:
no 10DLC brand, no campaign vetting, no carrier review. The cost is the phone, a
prepaid SIM, a charger that never gets unplugged, and the risk that a carrier throttles
a SIM that texts hundreds of strangers, which at Gertrude's intended cadence should
not happen. Anselm (later the same evening): the hotel phone did text only, "which is
actually fine to start with", and we are not abusing Google Play, since it is one
sideloaded app on one phone of ours, not something published. Agreed on texts. For
voice the Play policy is only the surface; the wall is Android itself: a non-system
app cannot inject audio into a call's uplink at all, and capturing the downlink works
only on some devices by accessibility tricks. So even our own sideloaded app can carry
her voice only by speakerphone and a cable, or on a rooted phone with a system dialer. A SIM in a GoIP
box or a Quectel modem has the same problem in 2026 form: US 2G/3G is gone and VoLTE
through those devices is reported flaky. Voice goes through SIP; texts can go through
the phone.

**Cost per voice minute, estimated, not measured:** LiveKit agent session $0.01 +
Claude Sonnet with caching roughly $0.02 at about six turns a minute + Deepgram STT
about $0.005 + TTS $0.03–0.08 ≈ $0.07–0.12/min once past the free tier, nothing on
the phone leg at first. A ten-minute call about $1; a hundred such calls a month about
$100 plus the VM. SMS through the phone costs the SIM plan. The thinker's Opus passes
are pennies per person per day. A monthly cap in config stops outbound when hit.

## 5. Milestones, arranged by the story, not the channels

Anselm, later still: "Let's arrange milestones to minimize blockers - we can even
have a web only conversational interface to start - let's think about the whole
story. We are talking to people - walking a social network - trying to filter bad
actors - and matchmaking people in the background - consensually."

The story has four verbs: **talk**, **walk**, **filter**, **match**. Channels are a
second axis and each has its own blocker: the web has none (attest sign-in exists,
the Claude key exists, the VM is a command away); email needs only an SMTP account
and is outside the robocall law; SMS needs a phone, a SIM and a charger at his house;
phone voice needs a LiveKit account and the audio pipeline. So the story is built
web-first with email as her first outbound voice, and the other channels are added
when they are unblocked, in whatever order that happens. Each milestone ends with
something he and a few friends can use, and a devlog entry with what was measured.

**Blockers, named.** (a) His time to try each step and give names. (b) Trust flow:
attest states flow-from-a-root as its purpose but has not built scoring, so Gertrude
computes a simple Advogato flow locally over vouch records now and hands it to attest
later; nothing waits on attest. (c) Outbound contact: on the web she can only answer,
so email is added early as the channel she speaks first on; it needs consent in the
ordinary sense (an address given to her) and CAN-SPAM manners, not TCPA. (d) Hardware
for SMS and an account for voice: side quests that can run any week in parallel.

**M0 · This plan.** Sign-off.

**M1 · Talk** (web only). A page at the VM: sign in with attest, talk to Gertrude in
text. Persona v1 in the repo, with the disclosures (AI, run by Anselm as a public
service, open source, mostly public information). One log per person; the thinker
rewrites the card after each conversation; the card page shows what she holds, with
edit and delete-everything. Continuity: the same person on a phone browser and a
laptop continues one conversation. ntfy ping when someone talks to her. Deliverable:
Anselm and two friends, by link, each with a card they have read and corrected.

**M2 · Walk.** The network grows by conversation. She asks who people know and what
those people are about; a name given to her is stored as a claim with its source
("A says they know B, a potter in Sellwood"), never as a fact about B. She offers to
invite: the person sends the link themselves, or gives an email and she writes to B
saying only that A thought they might like to talk. B arrives on the web already
vouched by A. Edges, vouches and a local trust flow from the anchor set (Anselm, then
others he names); a graph page for him. Email is live here as her first outbound
channel. Deliverable: ten people reachable from Anselm within two hops, every one of
them arrived by invitation, none by cold contact.

**M3 · Filter.** The Advogato caps become real: what she does for a person (how many
invitations, whether she writes first, whether they can vouch) follows the flow to
them, and revoking a vouch cascades. The third-party rule is enforced in code, not
only in the prompt: her replies are checked for details about people other than the
speaker. Abuse signals (asking for others' contact details, many names with no
substance, inconsistent identities, hostile tone) raise a flag to Anselm by ntfy; a
flagged person is read-only until he decides. Do-not-contact list; retention jobs.
Deliverable: a red-team session where a fake account vouched by a fake account tries
to harvest the graph and gets exactly its certifiers' bounded capacity and nothing
else.

**M4 · Match.** The thinker, nightly and after each conversation, scores pairs across
circles and drafts a blurb for each side from that side's own card. Anselm approves
or declines from ntfy. She asks each party, in their next conversation or by email,
with the other side's blurb; both yes and his yes make an intro, sent by email to
both with the blurbs. Outcome asked later: met, useful, nothing. Funnel counters on
the admin page; daily cap; monthly cost cap. Deliverable: three intros among his
friends with outcomes recorded. **This is the MVP: M1 through M4, web and email
only.** A Gertrude you can talk to, who grows a vouched graph, bounds bad actors and
brokers consented intros, with no carrier, no hardware and no robocall law involved.

**M5 · Voice.** LiveKit Agents worker (Node, Anthropic plugin) on the VM, first as a
"talk to me" button on the same page (browser room, no number), then the free
LiveKit Cloud US number. Same log, same persona; a dropped call resumes by email or
on the page. TCPA consent captured on the web before she ever calls anyone back.
Deliverable: the dropped-call continuity test; Anselm's ear on whether she feels like
a person. The audio spike itself is unblocked today and can run as a side quest any
time; only its promotion into the product waits for M4.

**M6 · Texts.** The Android phone with a SIM, SMS Gateway for Android in
private-server mode, STOP and HELP in code, texting consent captured on the web.
Deliverable: a conversation that starts on the web and continues by text.

**M7 · Open participation.** Public repo tidy, README that explains her, persona and
matching rules editable by pull request, a second anchor who is not Anselm, one
bounded community as the first real deployment, the funnel published on the site.

Not in any milestone yet: WhatsApp, Google Meet, payments or bounties, multi-language,
a second persona, and **a Gertrude app in the app stores** (Anselm's thought, same
evening). An app would give her a carrier-free voice channel over WebRTC, push
notifications and a home-screen presence; the cost is the install, which is the
friction Boardy avoids on purpose, and a browser link already carries WebRTC voice
and video without one. Worth revisiting at M7 if people ask for it, or if a carrier
starts throttling the SIM.

## 6. Open questions for Anselm

1. Advogato confirmed. Plan computes trust flow inside Gertrude for now so nothing
   waits on attest, and moves it to attest when attest has scoring. Agreed?
2. Gertrude as the name, yes or no?
3. What exactly did the Android phone do at litahotel.com: texts only, or voice too,
   and how? Is that phone, or another old Android with a SIM, available for Gertrude?
4. Later, when the free LiveKit number is not enough: Telnyx or voip.ms as the SIP
   trunk? Nothing to decide now.
5. Transcripts only, no audio, as the standing rule?
6. Sibling of matchmaker with its own store, or a voice front door to matchmaker?
7. MIT licence and the `anselm` org, or `orbitalfoundation` like attest?
8. Who are the first five names?
9. Email for her first outbound channel: a transactional sender (Postmark, Resend,
   Mailgun all have small free tiers; unverified today) or the VM's own SMTP? A
   gertrude.monster or similar domain is implied; the .monster family fits.

## 7. Dead ends worth keeping

- Dessa looked like the answer and is a model with no door: no weights, no API, no
  LLM in the loop. Speech-to-speech models in general trade away the thing this
  project needs most, a brain we choose and a transcript we own.
- Joining Google Meet properly is not possible through Google; it is a browser bot or
  nothing. Hosting her own room is cheaper, more reliable and still "a video call".
- Hume EVI would have been a tidy answer for warmth and is being shut down in
  seventeen days.
- Twilio ConversationRelay was the first draft's voice shape: least audio code, but
  Twilio webhooks, TwiML and Trust Hub are exactly the maze Anselm hit at litahotel.com,
  and 10DLC would have put Twilio under SMS as well. LiveKit gives a number for free
  and texts go through a phone.
- iMessage and Signal are closed to bots; the "conventional gateways a real person
  uses" reduce, for an individual operator, to phone, SMS, email and web.
