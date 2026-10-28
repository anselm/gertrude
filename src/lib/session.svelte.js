import { rpc, reconnect } from "./api.js"; import * as attest from "./attest.js";
export const session = $state({ user: null, loaded: false, busy: false, progress: "", attest: "", error: "", stats: null });
const me = async () => { try { const j = await rpc("me"); session.user = j.user; session.error = j.error || ""; session.stats = j.stats || null; if (j.attest) { session.attest = j.attest; attest.setAttestOrigin(j.attest); } } catch { session.user = null; } };
export async function refresh() { const back = attest.returning(); await reconnect(); await me();
  if (back && !session.user && (await attest.session())) { await reconnect(); await me(); }
  session.loaded = true;
  if (!session.user && (await attest.session()) && session.error) { session.progress = "your sign-in did not hold: " + session.error; if (/revoked|expired|does not know|not \S+ this origin/.test(session.error)) await attest.signOut(); } else session.progress = ""; }
export async function login(popup = null) { session.busy = true; session.progress = popup ? "a small window opens on attest; your passkey signs there…" : "over to attest; your passkey signs there and brings you back…"; try { await attest.signIn(popup); session.progress = "checking with the server…"; await refresh(); if (!session.user) throw new Error(session.error || "the server did not accept the sign-in"); } catch (e) { session.progress = "sign-in failed: " + (e?.message || e); throw e; } finally { session.busy = false; } }
export async function logout() { await attest.signOut(); session.user = null; await reconnect(); session.progress = ""; }
