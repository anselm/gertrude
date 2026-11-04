# Voice, second pass the same day: two speeds, rules in front, the first real calls

2026-11-04, evening. Continues `20261104-spike-a-she-answers-the-telephone.md`. Claude Code session in the gertrude
room on servbox, working while Anselm walked ("iterate on what you can"). Rests on his first two real calls from an
iPhone in Safari (the worker journal on the VM), three headless calls on a scratch database, and benchmarks against the
Anthropic API. Point in time; the numbers are one afternoon's.

## What his calls showed

Spike A worked from a real phone on the first try: greeting, listening, barge-in (he cut her off twice). The silence per
turn was the problem, as predicted: from the end of his words to her first sound, 2.0 to 2.3 s, and her replies ran nine
to seventeen seconds each, which is far too long for a telephone. The transcriber heard him well. Nothing was lost.

## Where the time went, measured

Sonnet 5.5 takes 0.7 to 1.7 s to its first token whatever the prompt size: a one-line system prompt was no faster than
her whole persona. Sonnet 5.5 does not think before replying (the API says so when asked to disable thinking), so that
is its floor. Haiku 5.5 on a tiny prompt is a steady 0.58 s. On her full persona with tools Haiku took 2.4 to 3.6 s,
because it thinks first, and that turned out to matter below. Speech out is 0.2 s. The end-of-turn wait sits in front
of all of it.

## What changed

**A mouth and a mind** (`lib/talker.mjs`, `lib/voice-brain.mjs`). The mouth is Haiku 5.5 on a short spoken persona
(`persona/gertrude-voice.md`, about 330 words, cached), the person block, a briefing, the last sixteen turns, no tools,
ninety tokens at most, thinking off. It speaks every turn. The mind is Sonnet 5.5 with the full persona and the tools,
run after each stored exchange in the background (serially per call): it makes the invitation, notes the lead, changes
the settings, and writes a two-sentence briefing for the mouth's next turn. Judgement arrives one turn late and the
mouth is told to say so ("it is being written up now and will be on your card page"). Cost per spoken turn: one Haiku
call plus one Sonnet call in the background, both cached.

**Rules in front, kept narrow.** "Say that again" repeats her whole last sentence, not the cut; "hold on" gets "Take
your time"; a short goodbye gets one of three goodbyes and the line closes after it plays; silence gets "Mm?". Each is
a regex over the committed text with a word-count cap and a negation guard ("don't hang up"), because a rule that
misfires sounds like a phone menu. No canned answers to real questions.

**Preemptive generation on.** LiveKit now starts the mouth on the interim transcript, so the end-of-turn wait overlaps
the model. That forced a restructure: nothing is stored when the mouth starts, because an attempt may be thrown away;
the user's line is stored when LiveKit commits the turn (`brain.heard`) and hers when it has played (`brain.spoke`),
from what was actually heard and actually played. An abandoned attempt aborts its request (`signal` through
`llm.turn`). Each attempt is remembered with the text it produced, and the played text is matched back to its attempt,
which is how a rule's flags (hang up after this) belong to the reply that came from it. The first version put those
flags on the call and the goodbye fired while the previous reply was still playing.

**Endpointing** defaults now 450 ms minimum and 2 s maximum of silence (`VOICE_EOU_MIN`, `VOICE_EOU_MAX`).

**Room tokens can name an agent** (`roomToken({ agent })`), and a worker started with `LIVEKIT_AGENT_NAME_OVERRIDE`
answers only rooms that ask for it. That is how a dev worker on this box tests against the same LiveKit project while
the production worker keeps taking real calls.

## The headless calls

Same rig as Spike A (a WAV caller in headless Chrome, scratch database). After the fixes, one turn of a long sentence:
mouth first token 0.52 to 0.73 s, first sound 0.2 s later; "say that again" and "goodbye" answered in under 0.5 s with
no model call; the goodbye hung up cleanly; the mind made the invitation for the named friend and the mouth confirmed
it on the next turn from the briefing. One run split a long sentence into two user turns at a mid-sentence pause and
she answered the first half ("Go on, you were saying about the sailboat"); seen once, not understood, worth watching on
real calls.

Two traps for the record. Haiku 5.5 thinks by default; with a ninety-token budget it spent all of it thinking and said
nothing, and the mouth fell back to "Mm. Go on." Thinking is now off for the mouth (`thinking: {type: "disabled"}`,
with a retry on `between_tools` for models that never think, which is what Sonnet 5.5 asks for). And the first
rewrite logged the user's line before the reply and labelled the mouth's reply as a rule, so the mind never ran; the
attempt matching above fixed both.

## Voices

Fourteen voices LiveKit Inference serves on the key, the same three lines each, on a page to pick from by ear:
https://claude.ai/artifact/5xeYdGYWY1VATrKQRdLWbi (private to Anselm). First-sound times on that run ran 420 to 990 ms;
Deepgram Athena stays until he picks. `VOICE_TTS` in the environment file on the VM, then restart the voice unit.

## Open

- His ear on the two-speed brain: does Haiku keep her character? The briefing from the mind is the lever if not.
- The split-turn case above; endpointing and the turn detector against real speech, not a WAV.
- Adaptive interruption is billed in production; VAD interruption is what runs there, and it worked.
- A "Hmm" at end of turn as manners; not built, and may not be needed at 0.7 s.
- The "event loop blocked" warning at line open: `brain.open` itself takes 30 ms, so it is something else.
- The appointment tool ("shall I ring you at four?") and the push that opens the line; Spike B (a number); Spike C
  (outbound).

Not deployed by this session; the live box still runs Spike A with the cache fix.
