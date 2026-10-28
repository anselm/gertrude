// Domain operations behind the socket. Every function takes the signed-in user (or null) first and throws Fail for anything
// the caller may not do. The transport (server/index.mjs) only routes; the store only stores; this is where the rules live.
import "./env.mjs"; import { person as persons, event, card as cards, consent, llm as ledger, file as dbFile, lead as leads, invite as invites, edge } from "./store.mjs"; import * as talker from "./talker.mjs"; import * as thinker from "./thinker.mjs"; import * as llm from "./llm.mjs"; import { notify } from "./notify.mjs"; import { resolveAccount } from "./attest.mjs";
export class Fail extends Error { constructor(code, msg) { super(msg); this.code = code; } }
const ADMIN_HANDLE = process.env.ADMIN_HANDLE || "anselm"; let adminDid = process.env.ADMIN_DID || "";
export async function init() { if (!adminDid && ADMIN_HANDLE) { try { adminDid = (await resolveAccount(ADMIN_HANDLE)).did; console.log("admin is", ADMIN_HANDLE, adminDid); } catch (e) { console.error("could not resolve ADMIN_HANDLE on attest:", e.message); } } }
const isAdmin = (u) => !!u && (u.role === "admin" || (adminDid && u.did === adminDid));
const need = (u) => { if (!u) throw new Fail(401, "sign in first"); if (u.status !== "active") throw new Fail(403, "this account is paused"); return u; };
// A verified attest handshake becomes a person row (first visit) or finds one. The role admin is granted to ADMIN_HANDLE's DID.
export async function userForAttest(ctx) { if (!ctx) return null; let p = persons.byDid(ctx.root); const first = !p;
  if (!p) { p = persons.create({ did: ctx.root, handle: ctx.handle || "", role: adminDid && ctx.root === adminDid ? "admin" : "person" }); notify("Gertrude: someone new", `${p.handle || p.did.slice(0, 20)} signed in for the first time`, { tags: "wave" }); }
  else { persons.touch(p.id, ctx.handle || ""); if (adminDid && ctx.root === adminDid && p.role !== "admin") { persons.setRole(p.id, "admin"); p = persons.byId(p.id); } }
  return { ...p, first, admin: isAdmin(p) }; }
export const me = (u) => u ? { id: u.id, name: u.name, handle: u.handle, role: u.role, admin: isAdmin(u), status: u.status, first: !!u.first } : null;
// The conversation: history for the page; a turn streams tokens through `emit` and resolves with the stored reply.
// First load may carry an invitation token (the person arrived by someone's link): redeem it, join the graph, greet by way of it.
export function history(u, { invite = "" } = {}) { const p = need(u); let via = null;
  if (invite && typeof invite === "string") { const inv = invites.get(invite); if (inv && !inv.used_by && inv.by !== p.id) { via = invites.use(invite, p.id); if (via) notify("Gertrude: an invitation arrived", `${p.handle || p.id} came by ${via.by_name || via.by_handle}'s link`, { tags: "link" }); } }
  let ev = event.recent(p.id, 200); if (!ev.length) ev = [talker.greet(p, "web", via)]; else if (via) ev.push(talker.greet(p, "web", via)); return { events: ev.map(pub), card: cards.get(p.id), via: via ? { by: via.by_name || via.by_handle } : null }; }
// What a visitor sees on an invitation link before signing in: who sent it, nothing else. Public by design; the token is the secret.
export function peekInvite(u, { token }) { const inv = invites.get(String(token || "")); if (!inv) throw new Fail(404, "that link is not one of mine"); return { by: inv.by_name || inv.by_handle || "someone", lead: inv.lead_name || "", used: !!inv.used_by }; }
export const myLeads = (u) => { const p = need(u); return { leads: leads.list(p.id).map((l) => ({ id: l.id, name: l.name, about: l.about, created: l.created, link: l.invite ? talker.inviteLink(l.invite) : null, arrived: l.arrived, arrived_name: l.arrived_name })), edges: edge.of(p.id).map((e) => ({ with: e.a === p.id ? e.b_name : e.a_name, how: e.how, at: e.at })) }; };
export function makeInvite(u, { name, about }) { const p = need(u); name = String(name || "").trim().slice(0, 80); if (!name) throw new Fail(400, "a name, please"); const id = leads.add(p.id, name, String(about || "").slice(0, 300)); const token = invites.make(p.id, id); return { link: talker.inviteLink(token) }; }
export async function say(u, { text }, emit) { const p = need(u); text = String(text || "").trim().slice(0, 4000); if (!text) throw new Fail(400, "say something"); if (!event.recent(p.id, 1).length) talker.greet(p, "web");
  const out = await talker.reply({ person: p, channel: "web", text, onText: (t) => emit?.("token", t) }); return pub(out); }
const pub = (e) => ({ id: e.id, channel: e.channel, dir: e.dir, text: e.text, ts: e.ts });
// The card: what she holds, editable by its subject, deletable with everything else.
export const getCard = (u) => { const p = need(u); return { card: cards.get(p.id), consents: consent.list(p.id), person: { name: p.name, handle: p.handle, created: p.created } }; };
export function setCard(u, { card }) { const p = need(u); if (!card || typeof card !== "object") throw new Fail(400, "card must be an object"); const prior = cards.get(p.id) || {}; const { _updated, _through, _by, ...clean } = { ...prior, ...card }; cards.set(p.id, clean, prior._through || event.lastId(p.id), "person"); if (clean.name && clean.name !== p.name) persons.setName(p.id, String(clean.name).slice(0, 80)); return cards.get(p.id); }
export function setName(u, { name }) { const p = need(u); name = String(name || "").trim().slice(0, 80); if (!name) throw new Fail(400, "a name, please"); persons.setName(p.id, name); return { name }; }
export async function forgetMe(u) { const p = need(u); persons.remove(p.id); notify("Gertrude: someone left", `${p.name || p.handle || p.id} deleted everything`, { tags: "wave" }); return { ok: true }; }
export async function rethink(u) { const p = need(u); if (!llm.configured()) throw new Fail(503, "no model configured"); return { card: await thinker.rethink(p.id, "person") }; }
// Admin: the people, one person's log, costs. Read-only except rethink and pause.
export const adminOverview = (u) => { if (!isAdmin(u)) throw new Fail(403, "admins only"); const since = new Date(Date.now() - 30 * 864e5).toISOString(); return { people: persons.list(200), costs: ledger.costs(since), total: ledger.total(since), model: { talker: llm.TALKER, thinker: llm.THINKER, configured: llm.configured() }, db: dbFile }; };
export const adminPerson = (u, { id }) => { if (!isAdmin(u)) throw new Fail(403, "admins only"); const p = persons.byId(id); if (!p) throw new Fail(404, "no such person"); return { person: p, events: event.recent(id, 400).map(pub), card: cards.get(id), consents: consent.list(id) }; };
export const adminRethink = async (u, { id }) => { if (!isAdmin(u)) throw new Fail(403, "admins only"); return { card: await thinker.rethink(id, "admin") }; };
export const adminStatus = (u, { id, status }) => { if (!isAdmin(u)) throw new Fail(403, "admins only"); if (!["active", "paused"].includes(status)) throw new Fail(400, "status"); persons.setStatus(id, status); return { ok: true }; };
export const stats = () => ({ people: persons.count(), edges: edge.count() });
