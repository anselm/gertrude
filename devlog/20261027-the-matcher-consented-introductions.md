# The matcher: consented introductions (M4, moved up)

2026-10-27, late night. Claude Code (Fable 5.1), tmux room `gertrude` on canada1. Anselm: "A matching agent feels
critical early" and then "Let's go for it I will get more people later." This builds the plan's M4 ahead of M2's vouches
and M3's caps (`20261027-plan-a-digital-person-who-brokers-people.md`), as decided in
`20261027-evening-decisions-licence-public-names-and-what-comes-next.md`. Point-in-time snapshot.

## What was built

`lib/matcher.mjs`, the thinker's other job, with an `intro` table in the store beside `nudge`.

1. **Shortlist, per person.** For each eligible person (active, has a card with at least one need, offer or kind of
   person wanted, no introduction already in play) one Sonnet call sees that person's public card and the circle's public
   cards (no names; private facts stripped; people they already share an edge with, pairs tried in the last 90 days, and
   people with an introduction in play are left out) and picks up to three, scored 0 to 1 with a one-line why. The circle
   block is a cached system block so a review over many people pays for it once. Bar: 0.6.
2. **Draft, per pair.** One Opus call writes what each side will hear about the other (`blurb_a` is about A, for B), from
   that side's own public card only, and the exact question Gertrude will put to each (`ask_a`, `ask_b`), in her voice:
   who she has in mind, unnamed; what she would say about them in return, so they can correct it; nothing moves unless
   both say yes; the question. It may return `go=false` on reflection. The draft lands as `proposed` and Anselm gets an
   ntfy with both asks and Approve and Decline buttons (signed URLs on `/intro/:id/:action`, same scheme as nudges).
3. **Approve** queues both asks as already-approved nudges of kind `intro_ask`. The existing dispatcher sends them: quiet
   hours and channels as before; and new tonight, a person with no channel, or who turned unprompted messages off, gets
   the line written to the log instead, so it is waiting in the transcript when they next open the page. That change
   applies to any approved nudge, not only intro asks.
4. **Answers come in conversation.** The talker's context lists "Introductions in play" with the id, what she asked, and
   each side's state. Two new tools: `intro_answer(id, yes|no, said, reach)` and `intro_outcome(id, met|useful|nothing)`.
   A yes needs a reach line, the thing the person chooses to have handed over (an email, a number, a handle, a time and a
   cafe); if they say yes without one the tool answers that she should ask, and she does, once. A no drops the
   introduction; the other side hears only that it did not work out this time.
5. **Two yeses make it.** Each side gets one line with the other's name, the blurb about them, and the reach line they
   chose, through the dispatcher (so by push, ntfy, or the log). Anselm gets an ntfy. Nobody's name crosses before this.
6. **Outcome.** Ten days after an introduction is made with no outcome on file, her context tells her to ask once.
7. **Admin.** An Introductions section: funnel counts (proposed, approved, declined, dropped, made, met, useful, nothing),
   every introduction with both asks and both answers, approve and decline, "match everyone now", and "match?" per person.
   The card page gets Form G-4, the person's own record: what she asked, their answer, whether the other side has
   answered, and after both yeses the name, the blurb and the reach line.
8. **Caps.** One introduction in play per person; a pair not retried for 90 days; at most five new proposals per review;
   review every six hours (MATCH_EVERY_MS), first two minutes after start. Nothing is proposed for a person whose card
   has nothing to match on.

Persona: a new section, "When you have an introduction to offer": a question not a sale, unnamed until both yeses, tell
them what you would say about them, a no is a complete answer, ask once about the outcome, do not chase.

## Test

`scripts/match-test.mjs` (in `npm run test:live`; a few cents): Tess (needs a Volvo Penta hand, sews sails, one private
fact), Rhea (rebuilds small diesels, needs sail covers sewn), Omar (zoning newsletter). Shortlist for Tess returned Rhea
at 0.95 and nobody else. The draft named nobody and did not mention the private fact. Approve queued two asks, dispatch
delivered both to throwaway ntfy topics and logged them. Tess, in conversation: "Yes, please do. They can email me at
tess@example.com." The tool fired with the reach line; Gertrude said she would hand over the address and nothing else and
would come back when the other side answered. Rhea: "Sure, I'd be glad to." The tool fired without a reach line and she
asked for one; "Text me, 503 555 0100" completed it; the introduction was made and each side's log carries the other's
name and line. Funnel: made 1, met 1 after the outcome call. Retry cap holds. The first run found nothing wrong with
the code and one thing wrong with the test: its quiet hours were 23:00 to midnight and the clock said 23:14 Pacific.
Both test scripts now use a never-quiet clock.

Not eyeballed: the admin Introductions section and Form G-4 render behind attest sign-in, which the screenshot script
cannot do; the build compiles and the data shapes match the service. Anselm will see them first.

## What this is not yet

- Only two people in a circle of one can be introduced, so the first real introduction waits on his first names.
- No trust flow yet: anyone with a card is in the circle. M3's caps will gate who gets shortlisted.
- Reach lines are free text and are passed verbatim; the names guard does not run on them.
- Resources (places, events) are not matched; that is the user-fed resource table, next.
- A daily or monthly cost cap is still a number on the admin page, not a brake.
