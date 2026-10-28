# 2026-10-27 · Proactive Gertrude, local resources, and how she reaches people

Anselm, late evening, thinking aloud: "I think the real meat of this is that Gertrude goes out
of her way to review her recent memories and tries to suggest things. Hmm I can even see
Gertrude developing an understanding of local people, places, events - so connecting people not
just to each other but to local resources … she's a helpful old lady and tries to help
proactively but not bugging people too much. It does feel like we need an sms gateway or an app
that allows push notifications. I myself use ntfy.sh - what ways can we send notifications? Do
we need to make an installable app? Or use sms etc?" Point-in-time assessment; nothing built.

## The idea, restated

The thinker already rewrites each person's card after a conversation. The step he is naming is
the thinker as *initiator*: it reads what is fresh across everyone's cards, forms suggestions
("Tess wants a diesel mechanic; Sam rebuilt a Yanmar"; "the boat club has an open evening
Thursday"), and Gertrude delivers them, sparingly. Two consequences for the model:

- **Resources beside people.** A card today is a person. Add places, organisations, events and
  services as a second card kind with the same shape (what it offers, what it needs, who told
  her, public or not), told to her by people in conversation at first, fed from sources later
  (matchmaker already aggregates Portland postings, hustles holds Calagator events, the
  ontology scraper reads news; aggregation stays its own module per house policy).
- **Nudges with a cadence.** A nudge is a suggestion with a reason, drafted by the thinker,
  approved by Anselm while the funnel is young, then delivered on the person's chosen channel
  within their quiet hours. Per-person caps are the "not bugging" rule: one unprompted nudge a
  week by default, more only while they are replying, none to anyone who said stop. Everything
  she sends is also written to the one log, so the next conversation starts from it.

## Ways to reach a person who has said yes

Written from memory, 2026-10-27; the iOS detail and the free tiers should be checked before
building.

| Channel | Friction for the person | Cost / hardware | Two-way | Notes |
|---|---|---|---|---|
| **Web Push** (Push API + service worker, VAPID) | Allow notifications; on iPhone, first add the site to the Home Screen (iOS 16.4+, as I understand it) | Free; no third party but the browser vendors' push services | Tap opens the chat | The nearest thing to "an app with push" without an app store. Consent is the browser prompt itself |
| **Email** | None | A sender (Postmark, Resend, Mailgun have small free tiers, unverified) and a domain; deliverability warm-up | Yes, slowly | The planned first outbound channel; right for weekly digests and for her writing an invitation on someone's behalf |
| **ntfy** | Install the app, subscribe to a topic | Free | No | Right for Anselm and technical friends; a topic name is the password |
| **SMS from an Android phone + SIM** | None; everyone has it | A phone, a SIM, a charger; SMS Gateway for Android | Yes, naturally | The "old lady who texts" channel; consent captured on the web first; human-scale volume |
| **Telegram bot** | Have Telegram, press Start | Free | Yes | Trivial to run and proactive messages are allowed after Start; fits some communities, not Portland at large |
| **Discord bot DM** | Be in a server with her | Free | Yes | Same, for Discord communities |
| **Native app** | Install from a store | Store accounts, review, two codebases or a wrapper | Yes | Push for free, but the install is the friction Boardy avoids; Web Push on the home screen gets most of it |
| **Voice call** | None | LiveKit (plan M5) | Yes | Later |
| WhatsApp, iMessage, RCS, Signal | | | | Closed or business-only to a bot (plan, 2026-10-27) |

## Recommendation

1. **Web Push and email first.** Both free, both consented by the person's own act, no
   hardware, no carrier law. Web Push gives the phone buzz he is asking about; email gives
   reach to everyone and the digest cadence. A per-person channel table (kind, address or
   subscription, consent wording, quiet hours, cap) is the same table SMS and voice will use.
2. **ntfy as a channel kind** on day one, since it is one HTTP POST and he already has it.
3. **SMS via the Android phone** next, the moment there is a phone on a charger; it is the
   channel for people who will never install anything.
4. **No native app** until people ask for it.
5. **The nudge pipeline** is the real work: thinker proposes, Anselm approves from ntfy with
   approve and decline actions, the dispatcher respects caps and quiet hours, every nudge lands
   in the log. The resource card kind comes with it.
