# 2026-10-27 · Leaning in: names, invitation links, and no popup anywhere

Anselm, after his first real conversation with her: "Do we really need a popup anywhere? How can
Gertrude lean in more? Like actively grow her network? Right now it is fairly passive." His
transcript showed her refusing to take a name: "I can't carry anything from you to them, so the
cleanest route is for you to tell them about me yourself." Point-in-time entry; begins M2 "Walk".

## The diagnosis

The persona over-applied the third-party rule. The rule is that she never repeats what A said
about B to anyone, not that she cannot hear it. A passive Gertrude is a form; the plan's "walk"
verb is her asking who you know and handing you a way to bring them in.

## Built

- **Tools in the talker.** The streamed turn now carries two tools and a short tool loop (at most
  three rounds): `invite(name, about)` makes a lead with its source and a single-use invitation
  link, `https://gertrude.exe.xyz/i/<token>`, and returns it to her to hand over; `note_lead`
  keeps a name without a link. Tool calls are recorded in the event's meta.
- **Invitations.** The link is for the person to send on themselves; she never contacts the
  friend. The landing page says only "Anselm sent you to Gertrude" and offers sign-in; the token
  survives the attest redirect in localStorage; on the first history load it is redeemed: the
  lead is marked arrived, an `invited` edge joins the two people, she greets the newcomer by way
  of the sender, and Anselm gets an ntfy ping. Tokens are single use and never reveal what was
  said about the invitee.
- **Her context** now lists the people a person has pointed her at and their status (link made,
  arrived, noted), and who they are connected to, so she follows up instead of re-asking.
- **Form G-2 on the card page:** the names you gave her, each with a copy-link button or an
  "arrived" mark, and a field to make a link by hand.
- **Persona:** a "How you grow your circle" section: two or three names a conversation, a link
  for each, follow up on open threads when someone returns, and permission to want a bigger
  circle and say so.
- **No popup anywhere.** Sign-in is attest's redirect flow on every device; the page has nothing
  to lose at that moment. The Google Pay error page he saw during the popup sign-in is not
  explained by anything in Gertrude or attest; my guess is a stale tab behind the closed popup.

## Checked

`npm test`: 16 store checks including invite single-use, lead arrival and edge cascade.
`scripts/talk-test.mjs`, a scripted two-turn conversation against a scratch database: on the
turn naming Sam and Priya she called `invite` twice and answered with both links and "They'll
only hear that you sent them." The invitation landing page screenshotted locally. The first run
found that a lead was not linked to its token; fixed in the store.

## Open

- Trust flow from the anchor set over these edges (M2/M3); caps per person.
- Email as the channel for sending invitations when the person has no better way.
- The inviter's name on the landing page is the inviter's own disclosure; a person who wants to
  invite anonymously has no way yet.

## Later the same evening: the note is the product

Anselm: "I feel like I can get a blob of text to just send to a friend - basically an invite -
then I can send via sms or discord or email - that's a good start. It is more cool if Gertrude
reaches out to them herself but as far as an mvp goes this would be fine." Done: Form G-2 now
has, per name, a send button (the phone's share sheet), a copy-note button, and a show button
that prints the note on a card for selecting by hand. The note names the sender, says what she
is, and carries the one-time link. Her reaching out herself stays a later stage, with email
first; the inbound-first rule holds either way.
