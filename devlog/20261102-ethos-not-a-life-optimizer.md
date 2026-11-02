# Ethos: she is not here to optimise anyone's life

2026-11-02. Written by Claude (Fable 5.1, room `gertrude` on canada1) from a thought Anselm brought
back from a conversation with his friend Howard Silverman. Point-in-time: a design position, not
yet built. It bears on `devlog/20261027-the-matcher-consented-introductions.md` and on the trust
work that is still to come.

## What he said

> I was thinking with my friend Howard Silverman about the role of a service like this - really if
> we get to the heart of it we don't necessarily want to over optimize people's lives - we have to
> have a deeper ethos or guidance around helping people grow - so grit and challenging them and
> magic and serendipity and tricksters and so on - like we enter a degenerate state if we are too
> clinical

## Why it matters now

The matcher as shipped on 2026-10-27 is a fit engine. It scores each pair from 0 to 1 on "how much
good an introduction would do both of them", keeps the ones over 0.6, and drafts for the top one.
That is the right first thing to build and the wrong thing to leave alone. A fit engine run long
enough pairs like with like, closes every need with the nearest offer, and makes a tidy little
market. Nobody is stretched. The person becomes their card, the card becomes a query, and the
service becomes a vending machine for acquaintances. That is the degenerate state he means, and it
is what every dating app and recommender has converged on once it started optimising a number.

The older shape of the role is not clinical at all. The matchmaker, the village aunt, the fairy
godmother, the trickster at the crossroads: they meddle, they have hunches, they send you somewhere
you did not ask to go, and some of the time they are wrong on purpose. Lewis Hyde's *Trickster
Makes This World* (1998) is the book on why that figure is load-bearing in a culture rather than a
defect in it. Ivan Illich's *Tools for Conviviality* (1973) names the other side: a tool that does
things for people past a certain point makes them less able, and the cure is a tool that enlarges
what they can do themselves. Gertrude's persona already leans this way. The code behind her does
not yet.

## What changes, in order of how little it costs

1. **No number ever reaches a person.** She has a hunch, not a score. The score stays an operator's
   tool on the admin page and in the devlog. Persona and asks already comply; keep it that way as
   features grow.

2. **A wild-card share.** Some fraction of her proposals, one in four or five, is not the top of the
   shortlist. It is the pick she can give a reason for that is not fit: the person is doing
   something the other has never considered, they disagree about something that matters, one of
   them keeps meeting the same kind of person and could stand a different kind. The shortlist
   prompt grows a second ask: "and one person they would not think to meet, with the reason." The
   draft tells Anselm which kind it is. The funnel records it, so in a year we can see whether the
   hunches or the fits produced more of anything.

3. **Asks that give.** Today a need finds an offer. Just as often she should take someone a need
   they could meet, especially someone whose card is all needs and no offers. Being asked for help
   is a form of being seen, and giving is how a lot of people grow. The shortlist should look both
   ways, and the funnel should mark which way the ask ran.

4. **She does not solve everything.** Scarcity is part of the magic. One open introduction per
   person already holds; keep introductions rare rather than raising the cap when the circle grows.
   And sometimes the right answer to a need is not a person but a nudge: "I think you could ask
   for that yourself. The library on Tuesdays. Tell me what happens." A small task, not a delivery.

5. **The outcome question stays open.** "Met, useful, nothing" measures a transaction. Add room for
   the thing that is actually interesting: "not what I expected, but..." She should ask how it went
   in her own words and let the thinker file it, with one extra outcome value, `surprised`, so the
   wild cards can be judged on their own terms.

6. **Grit is a conversation, not a feature.** When someone comes back saying the introduction did
   not take, she does not immediately offer a better one. She asks what happened, and whether they
   tried twice. The persona gets a paragraph on this. No code.

## What does not change

- Consent at every step. The trickster's licence does not extend to introducing people who have
  not both said yes, or to withholding from either side what she will say about them. The surprise
  is in who, never in whether.
- Inbound first, AI disclosed, no third-party hearsay, Anselm approves while she is young.
- The fit engine stays. Most introductions should be good ones in the plain sense. The wild card
  is a seasoning, and its share is a knob (`MATCH_WILD`, default 0.2), not a philosophy that
  replaces the other.

## The deeper question, left open

He said "a deeper ethos or guidance around helping people grow". That is a statement about what
Gertrude wants for people, and it should eventually live in the persona as a short creed she can
be held to, in the About page as one honest sentence, and in the funnel as what gets counted.
Candidates for the creed: that she would rather a person be more capable than more comfortable;
that she does not know what is good for anyone and asks instead; that a good introduction leaves
both people larger than it found them. His words, when he has them, replace these.

Related: `devlog/20261027-sousveillance-not-panopticon.md` (the same instinct, pointed at data
rather than matching).
