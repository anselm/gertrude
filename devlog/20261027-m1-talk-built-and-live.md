# 2026-10-27 · M1 "Talk" built and live at gertrude.exe.xyz

Same day as the plan. Anselm: "Let's deploy to Gertrude.exe.dev right away. Ok go for it - I have
a lot of policy around how I like to build sites that you already know." Then, mid-build: "Let's
try to not use modern fonts typography and layout. What fonts were popular in 1977? What color
schemes? I am concerned that every site I see today looks the same." And: "Even layout style
could be dense and 1970's - may require some research." Point-in-time entry.

## What is live

https://gertrude.exe.xyz, exe.dev VM `gertrude` (created today, Node 22, systemd unit
`gertrude` on :8070, env in `/etc/gertrude.env`, SQLite at `/srv/gertrude/data/gertrude.db`).
Manual deploy: `deploy/deploy.sh`. Push is not deploy. Built from commit 524d184.

- Sign in through attest (the matchmaker pattern, copied: `lib/attest.mjs`, `src/lib/attest.js`,
  handshake type `gertrude-auth`). The first sign-in creates a person row; the handle `anselm`
  resolves to the admin DID at startup.
- Talk: her opening line is fixed text from `persona/gertrude.md` (the disclosure is code, not a
  hope), then each turn is Claude Sonnet 5.5 at low effort, streamed token by token over the
  socket, with the persona and house rules as a cached system block and the person's card as the
  uncached one. History is the tail of the one log, rebuilt every turn, with channel changes
  marked, so a later SMS or voice adapter continues the same conversation by writing to the same
  log. Server-side safety fallbacks are on; a refusal becomes "Let's leave that one, dear."
- Think: a sweep every minute finds people whose log moved past their card and who have been
  quiet three minutes, and Claude Opus 5.5 rewrites the card as structured JSON (summary, needs,
  offers, interests, people in kind, facts with quotes and a public flag, open threads, keep
  private, tone). The card page shows it; the person can edit it as text, ask for a rewrite, or
  delete everything (cascade: person, log, card, consents).
- Admin page: people, one person's log and card, 30-day cost ledger by purpose and model, pause.
- ntfy: a push on first sign-ins and on delete-everything, to the topic in `~/.config/ntfy/topic`.
- `?demo` renders a sample transcript without sign-in, for looking and sharing.

Verified: `npm test` (9 store checks); a live Sonnet smoke test with the key; headless
screenshots of `/?demo`, `/` and `/about` in light and dark, locally and on the VM. Not yet
verified: a real attest sign-in and a real conversation on the live site, which need Anselm's
passkey; the thinker's first card is therefore also unverified against real talk.

## 1977, first pass

Applied before research came back, from what I know (to be corrected by the research entry
that follows): cream stock, chocolate ink, burnt orange as the one accent, harvest gold on
hover; headings in Fraunces (OFL, soft heavy serif in the Cooper, Windsor, Souvenir family) and
the transcript in Courier Prime (OFL, typewriter). Both self-hosted from `public/fonts/`; no
request goes to Google. The conversation is a typed transcript with labelled speakers and 3 pt
rules, not bubbles. Light and dark both checked by eye. This departs from the house-ux default
(system fonts, 4 px radius) on Anselm's instruction for this project.

## Decisions made on the way

- The Anthropic key was not on servbox; Anselm pasted it. It lives in `.env` here, in
  `/etc/gertrude.env` on the VM, and in the harness private notes so no room hunts again.
- `@anthropic-ai/sdk` 1.3.0; `fallbacks: "default"` accepted by the API today.
- Fastify re-reads `dist/index.html` per request: a rebuild changes asset hashes and a cached
  shell served 404s for the new bundle (found by a blank screenshot, which is why one looks).
- Playwright's Chromium is on servbox; `scripts/shot.mjs` (from matchmaker) drives it over CDP.

## Open

- Anselm signs in and talks to her; reads his card after three quiet minutes.
- The dense-1970s layout pass, from the research agent's brief (next entry).
- M2: invitations, email, vouches, local trust flow.
