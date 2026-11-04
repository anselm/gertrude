# Vouches, a standing link, and a quieter door

2026-11-04, late. Claude Code session in the gertrude room on servbox. Anselm's ask, after the voice work: "can i share a
link to gertrude overall and try get some participants?", then "i kinda wanna have a trust graph - like i want gertrude
to know i vouched for a person or persons - maybe i get a custom url to hand out? i am worried also that they will land
on the site and it will feel overwhelming", then "ok touch this up and i will use that". Rests on the plan's Advogato
idea (anchors seed the graph, vouches are the edges, caps follow flow) and on reading the door as a stranger would.

## What a newcomer met before

A link, "An invitation", three paragraphs, a Sign In button, then a second site (attest) asking for a passkey, and only
then her first word. Three concepts before she speaks; the passkey step is the wall.

## What changed

- **A vouch is a record now** (`vouch` table: by, who, via, said, at; one per pair; `lib/store.mjs`). Using a one-time
  invitation makes one (`via: invite`), and so does arriving by someone's standing link (`via: link`). Each vouch also
  makes an edge `vouched`. This is the row the trust flow reads later; nothing reads it for caps yet.
- **A standing link per person:** `gertrude.exe.xyz/from/<handle>`, the attest handle, case-insensitive. Arrival stores
  the token as `@handle` across the sign-in redirect, `invite.peek` answers with the voucher's name, and the first
  history load after sign-in adds the vouch and has her greet by way of the voucher. One's own link, or a second visit,
  does nothing. Only people with a handle have one; the card page says so otherwise.
- **The door for a vouched arrival is one line in her voice:** "Anselm asked me to say hello." One paragraph with the
  disclosure, a Say hello button, "It takes your face or fingerprint, no password, no email", and "What is this?" to
  the about page. The front page lost two of its three paragraphs and says the same plain thing about sign-in.
- **The card page** gained Form G-2, Your link: the link, Send it (share sheet with a note in the person's own name),
  copy, who you vouched for, who vouched for you. Forms renumbered after it.
- **She knows:** the person block lists who vouched for this person and whom they vouched for, and tells her everyone
  has a standing link on their card page and not to read links aloud. One sentence in the persona.

Checked: temp-database run of peek, arrival, second visit, own link, both lists; store tests (19); screenshots of the
door in light and dark and the front page on a local server. The card page is behind sign-in and was not shot.

## Not done, on purpose or not yet

- **Talk first, sign in to be remembered.** The real answer to the wall: a vouched arrival talks a few turns on the
  strength of the link before being asked to sign in. About two days; next after this.
- **Caps that follow vouches.** The filter milestone. The record exists; the budget does not.
- **A nicer greeting for a standing-link arrival** than "sent you my way".
- Deploy was refused by the session's permission classifier; Anselm deploys.
