# 2026-10-27 · She reaches out: web app, push, nudges, location

Anselm, late: "if we install as a web app we can push. That is a good minimum bar. What I would
like to see in early stages - like before we have many users and are testing - is that Gertrude
can message us early users - providing suggestions. Hmm, a natively installed web app can also
get a users location if permitted - that would be fun too." Then: "We will need to encourage
people to install the web app." And: "in early stages I myself am up for being a guinea pig."
Also, for the record of why this project feels different to him: "What I really like about
Gertrude is the idea of her proactively - and I also like how she helps grow the network of
trust. I can see many communities eventually running their own version of her ... she leans in
a bit… my other matchmakers are more passive." Point-in-time entry; built and deployed the same
night. Continues `20261027-proactive-gertrude-and-how-she-reaches-people.md`.

## Built

- **Installable web app.** Manifest, icons (drawn with PIL from the mark: cream tile, orange
  ring, chocolate G; a maskable variant and a white badge), Apple meta tags, a service worker
  that shows a push and opens the chat on tap. An install card appears on the talk page after
  the first exchange and on the card page: Chrome's own prompt where it exists, the Share /
  Add to Home Screen instructions on iPhone. The persona asks once, with the reason.
- **Channels** (`lib/channels.mjs`, table `channel`): where a person may be reached, each added
  by their own act and recorded as a consent. Two kinds today: Web Push (VAPID keys in the env;
  the browser's subscription is the address; a 404/410 from the push service removes it) and
  ntfy (a topic they type). Email and SMS will be the same shape. Form G-3 on the card page:
  turn on notifications, add an ntfy topic, send a test, turn off.
- **Nudges** (`lib/nudge.mjs`, table `nudge`): the thinker as initiator. For each eligible
  person it reads their card, their leads, their recent log and what the circle offers *in
  kind only* (other cards' offers and needs with no names), and asks Opus 5.5 whether there is
  anything worth saying unprompted today; if so it drafts one to three sentences in her voice
  with a reason for the operator. `proposed` → Anselm approves or declines, from the admin page
  or from the ntfy push's two action buttons (signed one-time URLs, the one HTTP write in the
  app) → `approved` → the dispatcher sends outside quiet hours (21:00–08:00 Pacific by default,
  the person's own time zone when they shared location) on all their channels and writes the
  text into the one log, so the next conversation starts from it. Eligibility: active, has a
  channel, nothing pending, not nudged within their interval (7 days by default, per person
  settable; Anselm's set to 1), unless they have written since. Review runs every two hours
  and one minute after start; dispatch every three minutes.
- **Location**, coarse by design: the card page asks the browser, rounds to two decimals
  (about a kilometre), asks Nominatim for a neighbourhood and city, stores that with the time
  zone, records the consent; "forget" clears it. Her context says "near Sellwood, Portland".
- **Admin:** nudges waiting with approve and decline, "review everyone now", per-person "nudge?"
  and interval, channel count and quiet-hours state.

## Checked

`scripts/nudge-test.mjs`: a scratch person (Tess, a Vega, wants a diesel person, gave a link for
Sam that was never used) and a second card offering diesel rebuilds; eligibility refused without
a channel, allowed with a throwaway ntfy topic; the proposal came back as an `offer_in_kind`:
"Tess, I've been thinking about your Vega, and I wondered whether your neighbour ever got that
link. Separately, someone I know rebuilds small marine diesels, Volvo Penta among them. Would
you like me to ask whether they'd be open to meeting you?" No third party named; blocked while
pending; signature check holds; approve, dispatch, delivered to ntfy, logged as an out event on
channel `ntfy`; the weekly cap then applied. `npm test` still passes (store, dedup). Manifest and
service worker served locally and live. Not checked: a real Web Push subscription from a phone
(needs his device) and the install prompt on a real browser.

## Dead end kept

Rendering the icons through headless Chrome from `file://` hung and left forty Chrome processes
behind; `data:` URLs failed too once the ports were fouled. PIL drew them in a second. Lesson:
for a flat mark, draw it; keep Chrome for pages.

## Open

- Email as the third channel kind; SMS via the Android phone as the fourth.
- Taper and tune: the interval is per person already; cadence by reply rate is next.
- Resources (places, events, organisations) as a card kind the nudge can draw on.
- Trust flow and caps from the anchor set (M3).
