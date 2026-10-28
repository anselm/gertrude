# Evening decisions: licence, public repo, names, and what comes next

2026-10-27, late evening. Claude Code (Fable 5.1) in the tmux room `gertrude` on canada1, with
Anselm answering from his phone. This continues `20261027-she-reaches-out-web-app-push-nudges-location.md`
and settles several of the plan's open questions (`20261027-plan-a-digital-person-who-brokers-people.md`, §6).
Point-in-time snapshot.

## Decided tonight, his words

- "Mit license, anselm is the org, make repo public." Done: `LICENSE` (MIT, 2026 Anselm Hook),
  About page says so, repo `anselm/gertrude` made public. Open question 7 closed.
- "Feel free to update about re sousveillance." The drafted line from
  `20261027-sousveillance-not-panopticon.md` is on the About page, unchanged.
- "Eventually we want to allow third party brokers or yenta." Noted for M7: a community runs its
  own Gertrude, or another broker persona (his earlier matchmaker was called yenta) works the same
  graph. Nothing built; the store-per-instance design already allows one Gertrude per community.
- "One of our sites has a hashed profanity filter - I forget which - attest? Or matchmaker? We
  should do that." It is attest's `packages/handle-guard` (hashed word lists in twelve languages,
  not yet on npm). Vendored into `lib/handle-guard/` with a README saying so; `lib/names.mjs`
  checks names word by word, never as prose, because a real name must not be blocked for a
  syllable. Applied wherever a name enters: a person naming themselves (card page, card save),
  the thinker's extracted name, and the names of people someone mentions (invite and note_lead
  tools, the card page's invite form). The tool returns "that is not a name I will write down"
  and she asks what they would rather be called. Test: `scripts/names-test.mjs`, in `npm test`.
- "Sure fire off a nudge." Proposed on the live database for him by hand (the thinker's own
  review runs every two hours). It followed up on his unanswered message about a second
  invitation link. Sent to his ntfy with Approve and Decline. Dispatch respects his quiet hours
  (21:00–08:00), so an approval tonight lands at 08:00 unless he tells her "no quiet hours".
- "Vouches can come later." M2's vouch record and local trust flow stay after matching.
- "A matching agent feels critical early." M4 moves ahead of M2's remainder and M3. Next build.

## Answers given

**"Sending email seems hard?"** Sending is not: a transactional sender (Resend, Postmark;
small free tiers, unverified today) is an API key plus SPF and DKIM records on a domain, and the
Cloudflare token can write those. What is hard is everything around it: a domain for her
(gertrude.monster was the thought), deliverability while the domain is new, and the inbound half,
where replies arrive as a webhook and quoted text has to be stripped. Now that Web Push works
from his phone, email's distinct value is reaching people who never install and resuming a
dropped conversation. Deferred until a real need; the invitation note already covers invites.

**Content: "I was thinking Gertrude could be fed entirely by users - plucking out those facts
seems important. Or we can do other approaches for getting venues events etc?"** User-fed first.
It is the sousveillance answer (what she knows about a place is what someone chose to tell her,
with the source kept) and it needs no scraping. Shape: the thinker's card pass also extracts
mentions of places, events, organisations and things into a `resource` table, each with who said
it and whether they said it is public; the nudge and the matcher draw on them. Second source,
same shape: hand her a link and she reads it ("here is the bike kitchen's page"). Scraping
Meetup, Eventbrite and the like is rot and terms-of-service trouble; a community can paste a
calendar instead. Not built yet; after the matcher.

**"Users should be able to send photos that we do scene understanding on … later?"** Later, and
cheap when it comes: the talker's model reads images. The analogue of transcripts-only is to keep
her description of the photo, not the photo, unless the person asks otherwise.

**"We have to figure out how to pay for Gertrude - wish that web wallets existed."** A serious
later item. Where it stands: he pays Anthropic credits while she is small (the ledger on the admin
page says what she has cost). The open-source story is that a community runs its own with its own
key, which is also the third-party-broker story. For individuals, a card checkout excludes the
unbanked, which he minds; the Advogato shape suggests the alternative, that anchors or a community
sponsor pay for the flow under them, so nobody pays alone. Web-native payment standards exist as
efforts (Interledger's Open Payments and Web Monetization) and are untested by us. Nothing decided.

## Also

- The quoted brief in the plan devlog named his personal ntfy topic. Redacted in the tree before
  the repo went public; the line remains in git history (commit of the plan). ntfy.sh topics are
  open to anyone who knows the name, and his carries the handles of people who talk to her, so
  rotating the topic is recommended; it is his to do since his phone and other projects subscribe.
- Still waiting on him: five first names; the email question above when it matters.
