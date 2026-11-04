// Telephone numbers as a light identity. A number on a card does three things: she knows the person when that phone rings her,
// the words they gave it with are the consent she needs before she may ring them, and a stranger-card she made when that phone
// first called her folds into the real one. Numbers are kept in E.164; she never reads one aloud, only the last four digits.
import { person as persons, channel, consent } from "./store.mjs";
export function normalize(raw) { const s = String(raw || "").trim(); if (!s) return null; const d = s.replace(/\D/g, "");
  if (s.startsWith("+") && d.length >= 8 && d.length <= 15) return "+" + d; if (d.length === 10) return "+1" + d; if (d.length === 11 && d[0] === "1") return "+" + d; return null; }
export const last4 = (e) => String(e || "").slice(-4);
export function ownerOf(e164) { const tel = persons.byDid("tel:" + e164); if (tel) return tel; const id = channel.owner("phone", e164); return id ? persons.byId(id) : null; }
export function of(p) { const c = channel.list(p.id).find((c) => c.kind === "phone"); return c ? c.address : null; }
export function attach(p, raw, said = "", via = "web") {
  const e = normalize(raw); if (!e) throw Object.assign(new Error("that doesn't look like a telephone number"), { status: 400 });
  const o = ownerOf(e); let merged = false;
  if (o && o.id !== p.id) { if (!String(o.did).startsWith("tel:")) throw Object.assign(new Error("that number is on someone else's card"), { status: 409 }); persons.merge(o.id, p.id); merged = true; }
  detach(p, false); channel.add(p.id, "phone", e, "telephone"); consent.add(p.id, "phone", (said || "gave their telephone number").slice(0, 300) + " → ends " + last4(e), via);
  return { phone: e, merged };
}
export function detach(p, revoke = true) { for (const c of channel.list(p.id)) if (c.kind === "phone") channel.remove(c.id, p.id); if (revoke) consent.revoke(p.id, "phone"); }
