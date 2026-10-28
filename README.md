# Gertrude

Gertrude is a digital person who connects people. She asks what you are up to and what you
could use, keeps a card on you that you can read, correct and delete, and when two cards fit
she asks both sides whether they would like to meet. Nothing is sent to anyone until both have
said yes. She says plainly that she is a program, run by Anselm Hook in Portland, Oregon, as a
public service.

Live: https://gertrude.exe.xyz (sign in with a passkey through [attest](https://attest.monster)).
A sample of how she talks: https://gertrude.exe.xyz/?demo

## Where this came from

Anselm asked for it on 2026-10-27: a Boardy-like "digital person service that will connect
people to each other", consumer to consumer, "a kind of gossip network facilitator or social
glue", proactive, seeded by network anchors (Advogato-style trust flow), voice first with SMS,
a call room and a web page, one conversation that survives channel hops, open source and open
participation. The plan, criteria, research and milestones are in
`devlog/20261027-plan-a-digital-person-who-brokers-people.md`; every later entry in `devlog/`
continues it. The work was done by Claude Code (Fable 5.1) in the tmux room `gertrude` on
servbox; the first session is linked from the devlog entries.

## The story, in four verbs

**Talk** (built): web chat, one log per person, a card rewritten by a slower model after each
conversation, the card page with edit and delete-everything.
**Walk** (next): the graph grows by conversation and invitation; vouches; trust flow from the
anchors. **Filter**: caps by trust flow, the third-party rule in code, abuse flags.
**Match**: pairs across circles, double opt-in, intros by email, outcomes.
Voice (LiveKit) and texts (an Android phone with a SIM) are channels added after the story works.

## Layout

- `persona/gertrude.md` is who she is. Improve her by pull request; the server rereads it.
- `lib/` is the brain: `store.mjs` (the only code that touches SQLite), `talker.mjs` (one live
  turn, context rebuilt from the log every time), `thinker.mjs` (rewrites the card), `llm.mjs`
  (Claude, with a cost ledger), `service.mjs` (the rules), `attest.mjs` (identity).
- `server/index.mjs` is transport only: socket.io requests `{name, payload}`, static build.
- `src/` is the Svelte 5 client. `deploy/` provisions and deploys the exe.dev VM.
- `npm test` runs the store checks; `scripts/shot.mjs` screenshots a page headlessly.

## Running it

```
cp .env.example .env   # ANTHROPIC_API_KEY, ATTEST_URL, ADMIN_HANDLE
npm install && npm run build && npm start   # http://localhost:8070
```

MIT.

## Licence

MIT. See `LICENSE`.
