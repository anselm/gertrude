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
`);
const now = () => new Date().toISOString(); const q = (sql) => db.prepare(sql);
const S = {
  personByDid: q("SELECT * FROM person WHERE did=?"), personById: q("SELECT * FROM person WHERE id=?"),
  insertPerson: q("INSERT INTO person (id,did,handle,name,role,created,last_seen) VALUES (?,?,?,?,?,?,?)"),
  touch: q("UPDATE person SET last_seen=?, handle=COALESCE(NULLIF(?,''),handle) WHERE id=?"), setName: q("UPDATE person SET name=? WHERE id=?"), setRole: q("UPDATE person SET role=? WHERE id=?"), setStatus: q("UPDATE person SET status=? WHERE id=?"),
  count: q("SELECT COUNT(*) n FROM person"), persons: q("SELECT p.*, (SELECT COUNT(*) FROM event e WHERE e.person=p.id) events, (SELECT MAX(ts) FROM event e WHERE e.person=p.id) last_event FROM person p ORDER BY last_seen DESC LIMIT ?"),
  deletePerson: q("DELETE FROM person WHERE id=?"),
  addEvent: q("INSERT INTO event (person,channel,dir,text,ts,meta) VALUES (?,?,?,?,?,?)"), events: q("SELECT * FROM event WHERE person=? ORDER BY id DESC LIMIT ?"), eventsAfter: q("SELECT * FROM event WHERE person=? AND id>? ORDER BY id"),
  lastEventId: q("SELECT COALESCE(MAX(id),0) id FROM event WHERE person=?"), lastEventAt: q("SELECT MAX(ts) ts FROM event WHERE person=?"),
  card: q("SELECT * FROM card WHERE person=?"), setCard: q("INSERT INTO card (person,json,updated,through,by) VALUES (?,?,?,?,?) ON CONFLICT(person) DO UPDATE SET json=excluded.json, updated=excluded.updated, through=excluded.through, by=excluded.by"),
  stale: q("SELECT p.id, p.name, (SELECT MAX(id) FROM event e WHERE e.person=p.id) last, (SELECT MAX(ts) FROM event e WHERE e.person=p.id) last_at, COALESCE(c.through,0) through FROM person p LEFT JOIN card c ON c.person=p.id WHERE p.status='active'"),
  addConsent: q("INSERT INTO consent (id,person,kind,wording,channel,at) VALUES (?,?,?,?,?,?)"), consents: q("SELECT * FROM consent WHERE person=? ORDER BY at"), revoke: q("UPDATE consent SET revoked_at=? WHERE person=? AND kind=? AND revoked_at IS NULL"),
  addLlm: q("INSERT INTO llm_call (at,person,purpose,model,input,cached,output,cost,ms,stop) VALUES (?,?,?,?,?,?,?,?,?,?)"),
  costs: q("SELECT purpose, model, COUNT(*) n, SUM(input) input, SUM(cached) cached, SUM(output) output, ROUND(SUM(cost),4) cost FROM llm_call WHERE at>=? GROUP BY purpose, model ORDER BY cost DESC"), costTotal: q("SELECT ROUND(COALESCE(SUM(cost),0),4) cost, COUNT(*) n FROM llm_call WHERE at>=?"),
  addDnc: q("INSERT OR REPLACE INTO dnc (value,kind,at,wording) VALUES (?,?,?,?)"), dnc: q("SELECT * FROM dnc WHERE value=?"),
};
const parseCard = (r) => r ? { ...JSON.parse(r.json), _updated: r.updated, _through: r.through, _by: r.by } : null;
export const person = { byDid: (did) => S.personByDid.get(did) || null, byId: (id) => S.personById.get(id) || null, count: () => S.count.get().n, list: (n = 200) => S.persons.all(n),
  create: ({ did, handle = "", name = "", role = "person" }) => { const id = randomUUID().slice(0, 8), t = now(); S.insertPerson.run(id, did, handle, name || handle || "", role, t, t); return S.personById.get(id); },
  touch: (id, handle = "") => S.touch.run(now(), handle, id), setName: (id, name) => S.setName.run(name, id), setRole: (id, role) => S.setRole.run(role, id), setStatus: (id, status) => S.setStatus.run(status, id),
  // Delete-everything: person, events, card and consents go together (cascade). The ledger keeps cost rows with no person.
  remove: (id) => S.deletePerson.run(id) };
export const event = { add: (p, channel, dir, text, meta = null) => { const ts = now(); const r = S.addEvent.run(p, channel, dir, text, ts, meta ? JSON.stringify(meta) : null); return { id: Number(r.lastInsertRowid), person: p, channel, dir, text, ts, meta }; },
  recent: (p, n = 60) => S.events.all(p, n).reverse().map(parseEvent), after: (p, id) => S.eventsAfter.all(p, id).map(parseEvent), lastId: (p) => S.lastEventId.get(p).id, lastAt: (p) => S.lastEventAt.get(p).ts };
const parseEvent = (e) => ({ ...e, meta: e.meta ? JSON.parse(e.meta) : null });
export const card = { get: (p) => parseCard(S.card.get(p)), set: (p, json, through, by = "thinker") => S.setCard.run(p, JSON.stringify(json), now(), through, by),
  // people whose log has moved past what their card covers, and who have been quiet for `idleMs`
  stale: (idleMs) => S.stale.all().filter((r) => r.last && r.last > r.through && Date.now() - Date.parse(r.last_at) >= idleMs) };
export const consent = { add: (p, kind, wording, channel) => S.addConsent.run(randomUUID().slice(0, 12), p, kind, wording, channel, now()), list: (p) => S.consents.all(p), revoke: (p, kind) => S.revoke.run(now(), p, kind) };
export const llm = { add: (r) => S.addLlm.run(now(), r.person || null, r.purpose, r.model, r.input || 0, r.cached || 0, r.output || 0, r.cost || 0, r.ms || 0, r.stop || ""), costs: (since) => S.costs.all(since), total: (since) => S.costTotal.get(since) };
export const dnc = { add: (value, kind, wording = "") => S.addDnc.run(value, kind, now(), wording), has: (value) => !!S.dnc.get(value) };
export const file = FILE;
