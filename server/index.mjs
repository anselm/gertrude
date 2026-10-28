#!/usr/bin/env node
// Transport only. One socket per client; {name, payload} requests switched here to the service; a turn streams tokens back
// on the same socket before its ack. HTTP serves the static build and nothing else (identity rides in the socket handshake).
import "../lib/env.mjs"; import Fastify from "fastify"; import fstatic from "@fastify/static"; import { Server } from "socket.io";
import { join, dirname } from "node:path"; import { fileURLToPath } from "node:url"; import { existsSync, readFileSync } from "node:fs"; import * as svc from "../lib/service.mjs"; import * as thinker from "../lib/thinker.mjs"; import { verifyHandshake, ATTEST_URL } from "../lib/attest.mjs";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), ".."); const PORT = Number(process.env.PORT || 8070), HOST = process.env.HOST || "0.0.0.0";
const app = Fastify({ logger: false, bodyLimit: 64 * 1024 });
const H = {
  "me": async (u) => ({ user: svc.me(u), attest: ATTEST_URL, stats: svc.stats() }),
  "talk.history": (u) => svc.history(u), "talk.say": (u, p, sock) => svc.say(u, p, (ev, data) => sock.emit(ev, data)),
  "card.get": (u) => svc.getCard(u), "card.set": (u, p) => svc.setCard(u, p), "card.rethink": (u) => svc.rethink(u), "me.setName": (u, p) => svc.setName(u, p), "me.forget": (u) => svc.forgetMe(u),
  "admin.overview": (u) => svc.adminOverview(u), "admin.person": (u, p) => svc.adminPerson(u, p), "admin.rethink": (u, p) => svc.adminRethink(u, p), "admin.status": (u, p) => svc.adminStatus(u, p),
};
const dist = join(ROOT, "dist");
if (existsSync(dist)) { await app.register(fstatic, { root: dist, prefix: "/", index: false }); const shell = () => readFileSync(join(dist, "index.html"), "utf8"); // read per request: a rebuild changes the asset hashes
  app.get("/", async (req, rep) => rep.type("text/html").send(shell())); app.get("/version.json", async (req, rep) => rep.send(existsSync(join(dist, "version.json")) ? JSON.parse(readFileSync(join(dist, "version.json"), "utf8")) : {}));
  app.setNotFoundHandler(async (req, rep) => { if (req.method !== "GET" || /\.[a-z0-9]{2,5}$/i.test(req.url.split("?")[0])) return rep.code(404).send({ error: "not found" }); return rep.type("text/html").send(shell()); }); }
app.addHook("onSend", (req, reply, payload, done) => { if (req.url.startsWith("/assets/")) reply.header("cache-control", "public, max-age=31536000, immutable"); else if (!req.url.startsWith("/socket.io")) reply.header("cache-control", "no-cache"); done(); });
await app.ready(); const io = new Server(app.server, { serveClient: false, maxHttpBufferSize: 64 * 1024 });
io.on("connection", (sock) => { let user; sock.data = {}; const origin = sock.handshake.headers.origin || "";
  const auth = async () => { sock.data.authError = ""; try { const ctx = await verifyHandshake(sock.handshake.auth?.attest, origin); user = await svc.userForAttest(ctx); } catch (e) { sock.data.authError = e.message; user = null; } return user; };
  sock.on("rpc", async (req, ack) => { const { name, payload = {} } = req || {}; const fn = H[name];
    try { if (!fn) throw new svc.Fail(404, `no such request: ${name}`); if (user === undefined || name === "me") await auth(); const data = await fn(user, payload, sock); if (name === "me") data.error = sock.data.authError || ""; ack({ ok: true, data }); }
    catch (e) { ack({ ok: false, code: e.code || 500, error: e.message }); if (!e.code) console.error(name, e); } }); });
await svc.init(); thinker.start();
await app.listen({ port: PORT, host: HOST }); console.log(`gertrude listening on http://${HOST}:${PORT} (socket.io; identity from ${ATTEST_URL})`);
