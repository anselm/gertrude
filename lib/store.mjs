// The one module that touches the database (house policy). SQLite via node:sqlite, one file, WAL. Every other module calls
// named functions here and never sees SQL. Shapes are plain objects; JSON columns are parsed on the way out.
import { DatabaseSync } from "node:sqlite"; import { mkdirSync } from "node:fs"; import { join, dirname } from "node:path"; import { fileURLToPath } from "node:url"; import { randomUUID } from "node:crypto";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), ".."); const FILE = process.env.GERTRUDE_DB || join(ROOT, "data", "gertrude.db");
mkdirSync(dirname(FILE), { recursive: true }); const db = new DatabaseSync(FILE); db.exec("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;");
db.exec(`
CREATE TABLE IF NOT EXISTS person   (id TEXT PRIMARY KEY, did TEXT UNIQUE NOT NULL, handle TEXT, name TEXT, role TEXT DEFAULT 'person', status TEXT DEFAULT 'active', created TEXT NOT NULL, last_seen TEXT);
CREATE TABLE IF NOT EXISTS event    (id INTEGER PRIMARY KEY AUTOINCREMENT, person TEXT NOT NULL REFERENCES person(id) ON DELETE CASCADE, channel TEXT NOT NULL, dir TEXT NOT NULL, text TEXT NOT NULL, ts TEXT NOT NULL, meta TEXT);
CREATE INDEX IF NOT EXISTS event_person ON event(person, id);
CREATE TABLE IF NOT EXISTS card     (person TEXT PRIMARY KEY REFERENCES person(id) ON DELETE CASCADE, json TEXT NOT NULL, updated TEXT NOT NULL, through INTEGER NOT NULL DEFAULT 0, by TEXT NOT NULL DEFAULT 'thinker');
CREATE TABLE IF NOT EXISTS consent  (id TEXT PRIMARY KEY, person TEXT NOT NULL REFERENCES person(id) ON DELETE CASCADE, kind TEXT NOT NULL, wording TEXT NOT NULL, channel TEXT NOT NULL, at TEXT NOT NULL, revoked_at TEXT);
CREATE TABLE IF NOT EXISTS llm_call (id INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT NOT NULL, person TEXT, purpose TEXT NOT NULL, model TEXT NOT NULL, input INTEGER, cached INTEGER, output INTEGER, cost REAL, ms INTEGER, stop TEXT);
CREATE TABLE IF NOT EXISTS dnc      (value TEXT PRIMARY KEY, kind TEXT NOT NULL, at TEXT NOT NULL, wording TEXT);
CREATE TABLE IF NOT EXISTS lead     (id TEXT PRIMARY KEY, by TEXT NOT NULL REFERENCES person(id) ON DELETE CASCADE, name TEXT NOT NULL, about TEXT, created TEXT NOT NULL, invite TEXT, arrived TEXT);
CREATE TABLE IF NOT EXISTS invite   (token TEXT PRIMARY KEY, by TEXT NOT NULL REFERENCES person(id) ON DELETE CASCADE, lead TEXT, created TEXT NOT NULL, used_by TEXT, used_at TEXT);
CREATE TABLE IF NOT EXISTS edge     (a TEXT NOT NULL REFERENCES person(id) ON DELETE CASCADE, b TEXT NOT NULL REFERENCES person(id) ON DELETE CASCADE, how TEXT NOT NULL, at TEXT NOT NULL, PRIMARY KEY (a,b,how));
CREATE TABLE IF NOT EXISTS channel  (id TEXT PRIMARY KEY, person TEXT NOT NULL REFERENCES person(id) ON DELETE CASCADE, kind TEXT NOT NULL, address TEXT NOT NULL, label TEXT, created TEXT NOT NULL, last_sent TEXT, failures INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS nudge    (id TEXT PRIMARY KEY, person TEXT NOT NULL REFERENCES person(id) ON DELETE CASCADE, kind TEXT NOT NULL, text TEXT NOT NULL, reason TEXT, state TEXT NOT NULL DEFAULT 'proposed', created TEXT NOT NULL, decided TEXT, sent TEXT, by TEXT);
CREATE TABLE IF NOT EXISTS intro    (id TEXT PRIMARY KEY, a TEXT NOT NULL REFERENCES person(id) ON DELETE CASCADE, b TEXT NOT NULL REFERENCES person(id) ON DELETE CASCADE, score REAL, why TEXT, blurb_a TEXT, blurb_b TEXT, ask_a TEXT, ask_b TEXT, state TEXT NOT NULL DEFAULT 'proposed', created TEXT NOT NULL, decided TEXT, by TEXT,
  a_answer TEXT, b_answer TEXT, a_said TEXT, b_said TEXT, a_reach TEXT, b_reach TEXT, a_at TEXT, b_at TEXT, made TEXT, outcome_a TEXT, outcome_b TEXT);
CREATE INDEX IF NOT EXISTS intro_a ON intro(a); CREATE INDEX IF NOT EXISTS intro_b ON intro(b);
`);
for (const col of ["place TEXT", "lat REAL", "lon REAL", "place_at TEXT", "tz TEXT", "nudge_days REAL", "quiet_from INTEGER", "quiet_to INTEGER"]) { try { db.exec(`ALTER TABLE person ADD COLUMN ${col}`); } catch {} }
const now = () => new Date().toISOString(); const q = (sql) => db.prepare(sql);
const S = {
  personByDid: q("SELECT * FROM person WHERE did=?"), personById: q("SELECT * FROM person WHERE id=?"),
  insertPerson: q("INSERT INTO person (id,did,handle,name,role,created,last_seen) VALUES (?,?,?,?,?,?,?)"),
  touch: q("UPDATE person SET last_seen=?, handle=COALESCE(NULLIF(?,''),handle) WHERE id=?"), setName: q("UPDATE person SET name=? WHERE id=?"), setRole: q("UPDATE person SET role=? WHERE id=?"), setStatus: q("UPDATE person SET status=? WHERE id=?"),
  count: q("SELECT COUNT(*) n FROM person"), persons: q("SELECT p.*, (SELECT COUNT(*) FROM event e WHERE e.person=p.id) events, (SELECT MAX(ts) FROM event e WHERE e.person=p.id) last_event FROM person p ORDER BY last_seen DESC LIMIT ?"),
  deletePerson: q("DELETE FROM person WHERE id=?"),
  addEvent: q("INSERT INTO event (person,channel,dir,text,ts,meta) VALUES (?,?,?,?,?,?)"), eventById: q("SELECT * FROM event WHERE id=?"), amendEvent: q("UPDATE event SET text=COALESCE(?,text), meta=? WHERE id=?"), events: q("SELECT * FROM event WHERE person=? ORDER BY id DESC LIMIT ?"), eventsAfter: q("SELECT * FROM event WHERE person=? AND id>? ORDER BY id"),
  lastEventId: q("SELECT COALESCE(MAX(id),0) id FROM event WHERE person=?"), lastIn: q("SELECT * FROM event WHERE person=? AND dir='in' ORDER BY id DESC LIMIT 1"), replyTo: q("SELECT * FROM event WHERE person=? AND dir='out' AND id>? ORDER BY id LIMIT 1"), lastEventAt: q("SELECT MAX(ts) ts FROM event WHERE person=?"),
  card: q("SELECT * FROM card WHERE person=?"), setCard: q("INSERT INTO card (person,json,updated,through,by) VALUES (?,?,?,?,?) ON CONFLICT(person) DO UPDATE SET json=excluded.json, updated=excluded.updated, through=excluded.through, by=excluded.by"),
  stale: q("SELECT p.id, p.name, (SELECT MAX(id) FROM event e WHERE e.person=p.id) last, (SELECT MAX(ts) FROM event e WHERE e.person=p.id) last_at, COALESCE(c.through,0) through FROM person p LEFT JOIN card c ON c.person=p.id WHERE p.status='active'"),
  addConsent: q("INSERT INTO consent (id,person,kind,wording,channel,at) VALUES (?,?,?,?,?,?)"), consents: q("SELECT * FROM consent WHERE person=? ORDER BY at"), revoke: q("UPDATE consent SET revoked_at=? WHERE person=? AND kind=? AND revoked_at IS NULL"),
  addLlm: q("INSERT INTO llm_call (at,person,purpose,model,input,cached,output,cost,ms,stop) VALUES (?,?,?,?,?,?,?,?,?,?)"),
  costs: q("SELECT purpose, model, COUNT(*) n, SUM(input) input, SUM(cached) cached, SUM(output) output, ROUND(SUM(cost),4) cost FROM llm_call WHERE at>=? GROUP BY purpose, model ORDER BY cost DESC"), costTotal: q("SELECT ROUND(COALESCE(SUM(cost),0),4) cost, COUNT(*) n FROM llm_call WHERE at>=?"),
  addDnc: q("INSERT OR REPLACE INTO dnc (value,kind,at,wording) VALUES (?,?,?,?)"), dnc: q("SELECT * FROM dnc WHERE value=?"),
  addLead: q("INSERT INTO lead (id,by,name,about,created,invite) VALUES (?,?,?,?,?,?)"), leads: q("SELECT l.*, i.used_at, (SELECT name FROM person WHERE id=i.used_by) arrived_name FROM lead l LEFT JOIN invite i ON i.token=l.invite WHERE l.by=? ORDER BY l.created DESC"), leadArrived: q("UPDATE lead SET arrived=? WHERE invite=?"),
  addInvite: q("INSERT INTO invite (token,by,lead,created) VALUES (?,?,?,?)"), setLeadInvite: q("UPDATE lead SET invite=? WHERE id=?"), invite: q("SELECT i.*, p.name by_name, p.handle by_handle, l.name lead_name FROM invite i JOIN person p ON p.id=i.by LEFT JOIN lead l ON l.id=i.lead WHERE i.token=?"), useInvite: q("UPDATE invite SET used_by=?, used_at=? WHERE token=? AND used_by IS NULL"),
  setNudgeDays: q("UPDATE person SET nudge_days=? WHERE id=?"), setQuiet: q("UPDATE person SET quiet_from=?, quiet_to=? WHERE id=?"),
  setPlace: q("UPDATE person SET place=?, lat=?, lon=?, place_at=?, tz=COALESCE(?,tz) WHERE id=?"), clearPlace: q("UPDATE person SET place=NULL, lat=NULL, lon=NULL, place_at=NULL WHERE id=?"),
  addChannel: q("INSERT INTO channel (id,person,kind,address,label,created) VALUES (?,?,?,?,?,?)"), channels: q("SELECT * FROM channel WHERE person=? ORDER BY created"), channelByAddress: q("SELECT * FROM channel WHERE person=? AND kind=? AND address=?"), delChannel: q("DELETE FROM channel WHERE id=? AND person=?"), delChannelAny: q("DELETE FROM channel WHERE id=?"), channelSent: q("UPDATE channel SET last_sent=?, failures=0 WHERE id=?"), channelFailed: q("UPDATE channel SET failures=failures+1 WHERE id=?"), channelCount: q("SELECT COUNT(*) n FROM channel"),
  addNudge: q("INSERT INTO nudge (id,person,kind,text,reason,state,created,by) VALUES (?,?,?,?,?,?,?,?)"), nudge: q("SELECT n.*, p.name person_name, p.handle person_handle FROM nudge n JOIN person p ON p.id=n.person WHERE n.id=?"), nudges: q("SELECT n.*, p.name person_name, p.handle person_handle FROM nudge n JOIN person p ON p.id=n.person WHERE (?='' OR n.state=?) ORDER BY n.created DESC LIMIT ?"), nudgesOf: q("SELECT * FROM nudge WHERE person=? ORDER BY created DESC LIMIT ?"),
  nudgeState: q("UPDATE nudge SET state=?, decided=COALESCE(decided,?), sent=COALESCE(?,sent) WHERE id=?"), lastNudgeSent: q("SELECT MAX(sent) sent FROM nudge WHERE person=? AND state='sent'"), openNudge: q("SELECT id FROM nudge WHERE person=? AND state IN ('proposed','approved') LIMIT 1"),
  addIntro: q("INSERT INTO intro (id,a,b,score,why,blurb_a,blurb_b,ask_a,ask_b,state,created,by) VALUES (?,?,?,?,?,?,?,?,?,'proposed',?,?)"),
  intro: q("SELECT i.*, pa.name a_name, pa.handle a_handle, pb.name b_name, pb.handle b_handle FROM intro i JOIN person pa ON pa.id=i.a JOIN person pb ON pb.id=i.b WHERE i.id=?"),
  intros: q("SELECT i.*, pa.name a_name, pa.handle a_handle, pb.name b_name, pb.handle b_handle FROM intro i JOIN person pa ON pa.id=i.a JOIN person pb ON pb.id=i.b WHERE (?='' OR i.state=?) ORDER BY i.created DESC LIMIT ?"),
  introsOf: q("SELECT i.*, pa.name a_name, pb.name b_name FROM intro i JOIN person pa ON pa.id=i.a JOIN person pb ON pb.id=i.b WHERE i.a=? OR i.b=? ORDER BY i.created DESC LIMIT ?"),
  introBetween: q("SELECT * FROM intro WHERE (a=? AND b=?) OR (a=? AND b=?) ORDER BY created DESC LIMIT 1"), openIntro: q("SELECT id FROM intro WHERE (a=? OR b=?) AND state IN ('proposed','approved') LIMIT 1"),
  introState: q("UPDATE intro SET state=?, decided=COALESCE(decided,?) WHERE id=?"), introMade: q("UPDATE intro SET state='made', made=? WHERE id=?"),
  introAnswerA: q("UPDATE intro SET a_answer=?, a_said=?, a_reach=COALESCE(NULLIF(?,''),a_reach), a_at=? WHERE id=?"), introAnswerB: q("UPDATE intro SET b_answer=?, b_said=?, b_reach=COALESCE(NULLIF(?,''),b_reach), b_at=? WHERE id=?"),
  introOutcomeA: q("UPDATE intro SET outcome_a=? WHERE id=?"), introOutcomeB: q("UPDATE intro SET outcome_b=? WHERE id=?"),
  introFunnel: q("SELECT state, COUNT(*) n FROM intro GROUP BY state"), introOutcomes: q("SELECT COALESCE(outcome_a,'') oa, COALESCE(outcome_b,'') ob FROM intro WHERE state='made'"),
  addEdge: q("INSERT OR IGNORE INTO edge (a,b,how,at) VALUES (?,?,?,?)"), edgesOf: q("SELECT e.*, pa.name a_name, pb.name b_name FROM edge e JOIN person pa ON pa.id=e.a JOIN person pb ON pb.id=e.b WHERE e.a=? OR e.b=? ORDER BY e.at"), edgeCount: q("SELECT COUNT(*) n FROM edge"),
};
const parseCard = (r) => r ? { ...JSON.parse(r.json), _updated: r.updated, _through: r.through, _by: r.by } : null;
export const person = { byDid: (did) => S.personByDid.get(did) || null, byId: (id) => S.personById.get(id) || null, count: () => S.count.get().n, list: (n = 200) => S.persons.all(n),
  create: ({ did, handle = "", name = "", role = "person" }) => { const id = randomUUID().slice(0, 8), t = now(); S.insertPerson.run(id, did, handle, name || handle || "", role, t, t); return S.personById.get(id); },
  touch: (id, handle = "") => S.touch.run(now(), handle, id), setName: (id, name) => S.setName.run(name, id), setRole: (id, role) => S.setRole.run(role, id), setStatus: (id, status) => S.setStatus.run(status, id),
  // Delete-everything: person, events, card and consents go together (cascade). The ledger keeps cost rows with no person.
  setNudgeDays: (id, d) => S.setNudgeDays.run(d, id), setQuiet: (id, from, to) => S.setQuiet.run(from, to, id), remove: (id) => S.deletePerson.run(id) };
export const event = { add: (p, channel, dir, text, meta = null) => { const ts = now(); const r = S.addEvent.run(p, channel, dir, text, ts, meta ? JSON.stringify(meta) : null); return { id: Number(r.lastInsertRowid), person: p, channel, dir, text, ts, meta }; },
  recent: (p, n = 60) => S.events.all(p, n).reverse().map(parseEvent), amend: (id, text, metaPatch = {}) => { const e = S.eventById.get(id); if (!e) return null; const meta = { ...(e.meta ? JSON.parse(e.meta) : {}), ...metaPatch }; S.amendEvent.run(text ?? null, JSON.stringify(meta), id); return parseEvent(S.eventById.get(id)); }, lastIn: (p) => { const e = S.lastIn.get(p); return e ? parseEvent(e) : null; }, replyTo: (p, inId) => { const e = S.replyTo.get(p, inId); return e ? parseEvent(e) : null; }, after: (p, id) => S.eventsAfter.all(p, id).map(parseEvent), lastId: (p) => S.lastEventId.get(p).id, lastAt: (p) => S.lastEventAt.get(p).ts };
const parseEvent = (e) => ({ ...e, meta: e.meta ? JSON.parse(e.meta) : null });
export const card = { get: (p) => parseCard(S.card.get(p)), set: (p, json, through, by = "thinker") => S.setCard.run(p, JSON.stringify(json), now(), through, by),
  // people whose log has moved past what their card covers, and who have been quiet for `idleMs`
  stale: (idleMs) => S.stale.all().filter((r) => r.last && r.last > r.through && Date.now() - Date.parse(r.last_at) >= idleMs) };
export const consent = { add: (p, kind, wording, channel) => S.addConsent.run(randomUUID().slice(0, 12), p, kind, wording, channel, now()), list: (p) => S.consents.all(p), revoke: (p, kind) => S.revoke.run(now(), p, kind) };
export const llm = { add: (r) => S.addLlm.run(now(), r.person || null, r.purpose, r.model, r.input || 0, r.cached || 0, r.output || 0, r.cost || 0, r.ms || 0, r.stop || ""), costs: (since) => S.costs.all(since), total: (since) => S.costTotal.get(since) };
// Leads: a name someone gave her, kept with its source and never repeated; an invite is the link that lets that person
// arrive already vouched. When the link is used, an edge joins inviter and invitee.
export const lead = { add: (by, name, about = "", invite = null) => { const id = randomUUID().slice(0, 10); S.addLead.run(id, by, name, about, now(), invite); return id; }, list: (by) => S.leads.all(by) };
export const invite = { make: (by, leadId = null) => { const token = randomUUID().replace(/-/g, "").slice(0, 12); S.addInvite.run(token, by, leadId, now()); if (leadId) S.setLeadInvite.run(token, leadId); return token; }, get: (token) => S.invite.get(token) || null,
  use: (token, personId) => { const t = now(); const r = S.useInvite.run(personId, t, token); if (r.changes) { S.leadArrived.run(t, token); const inv = S.invite.get(token); S.addEdge.run(inv.by, personId, "invited", t); return inv; } return null; } };
export const place = { set: (id, { place: label, lat, lon, tz }) => S.setPlace.run(label || null, lat ?? null, lon ?? null, now(), tz || null, id), clear: (id) => S.clearPlace.run(id) };
// Channels: where a person may be reached, each added by their own act (a push subscription, an ntfy topic). Address is JSON.
export const channel = { add: (p, kind, address, label = "") => { const a = JSON.stringify(address); const had = S.channelByAddress.get(p, kind, a); if (had) return had.id; const id = randomUUID().slice(0, 10); S.addChannel.run(id, p, kind, a, label, now()); return id; },
  list: (p) => S.channels.all(p).map((c) => ({ ...c, address: JSON.parse(c.address) })), remove: (id, p) => S.delChannel.run(id, p).changes, drop: (id) => S.delChannelAny.run(id), sent: (id) => S.channelSent.run(now(), id), failed: (id) => S.channelFailed.run(id), count: () => S.channelCount.get().n };
// Nudges: a suggestion Gertrude wants to send someone unprompted. proposed -> approved|declined -> sent.
export const nudge = { add: (p, kind, text, reason, by = "thinker", state = "proposed") => { const id = randomUUID().slice(0, 10); S.addNudge.run(id, p, kind, text, reason, state, now(), by); return S.nudge.get(id); }, get: (id) => S.nudge.get(id) || null, list: (state = "", n = 100) => S.nudges.all(state, state, n), of: (p, n = 20) => S.nudgesOf.all(p, n),
  setState: (id, state) => S.nudgeState.run(state, state === "sent" ? null : now(), state === "sent" ? now() : null, id), lastSent: (p) => S.lastNudgeSent.get(p).sent, hasOpen: (p) => !!S.openNudge.get(p) };
// Introductions: a pair the matcher proposes, Anselm approves, both sides are asked, both say yes, and only then do they
// learn each other's names and what each chose to hand over for being reached. proposed -> approved|declined -> made|dropped.
export const intro = { add: (r) => { const id = randomUUID().slice(0, 10); S.addIntro.run(id, r.a, r.b, r.score ?? null, r.why || "", r.blurb_a || "", r.blurb_b || "", r.ask_a || "", r.ask_b || "", now(), r.by || "matcher"); return S.intro.get(id); },
  get: (id) => S.intro.get(id) || null, list: (state = "", n = 100) => S.intros.all(state, state, n), of: (p, n = 20) => S.introsOf.all(p, p, n), between: (a, b) => S.introBetween.get(a, b, b, a) || null, hasOpen: (p) => !!S.openIntro.get(p, p),
  setState: (id, state) => S.introState.run(state, now(), id), made: (id) => S.introMade.run(now(), id),
  answer: (id, side, yes, said = "", reach = "") => (side === "a" ? S.introAnswerA : S.introAnswerB).run(yes ? "yes" : "no", said, reach, now(), id), outcome: (id, side, o) => (side === "a" ? S.introOutcomeA : S.introOutcomeB).run(o, id),
  funnel: () => { const f = Object.fromEntries(S.introFunnel.all().map((r) => [r.state, r.n])); const o = S.introOutcomes.all(); f.outcomes = { met: o.filter((r) => r.oa === "met" || r.ob === "met").length, useful: o.filter((r) => r.oa === "useful" || r.ob === "useful").length, nothing: o.filter((r) => r.oa === "nothing" || r.ob === "nothing").length, asked: o.length }; return f; } };
export const edge = { of: (p) => S.edgesOf.all(p, p), count: () => S.edgeCount.get().n };
export const dnc = { add: (value, kind, wording = "") => S.addDnc.run(value, kind, now(), wording), has: (value) => !!S.dnc.get(value) };
export const file = FILE;
