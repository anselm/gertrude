# gertrude

Project-specific orientation only. House policy (devlog, git, UX, writing,
deploy) comes from the harness and is not repeated here.

## What this is

Gertrude is a digital person, an old lady on the phone, who brokers people: she asks
what people need and can offer, keeps one memory of each person across phone, SMS and
web, and proposes consented introductions between ordinary people in a community.
Inspired by boardy.ai, aimed consumer to consumer. Brain is Claude (Anthropic credits);
voice is a cascade around it. Not yet deployed; target is an exe.dev VM `gertrude`.
The plan and criteria: `devlog/20261027-plan-a-digital-person-who-brokers-people.md`.

## Where things are

- Code: this folder. Repo: `anselm/gertrude`.
- Devlog: `devlog/` (dated entries; read the tail first).
- Deploy: see `project.toml`.

## Project-specific facts

- Inbound first: she never calls anyone without logged consent. Transcripts only, no
  audio. Disclose she is an AI on every first contact. These are rules, not defaults.
- Nothing outbound (calls, intros) without Anselm's approval via ntfy until a rule's
  funnel earns autonomy.
- Sign-in through attest.monster (see ~/projects/2027/attest); intro vocabulary from
  ~/projects/2027/matchmaker (lib/broker.mjs).
- Secrets: /etc/gertrude.env on the VM; harness private/ notes. ntfy topic in
  ~/.config/ntfy/topic.
