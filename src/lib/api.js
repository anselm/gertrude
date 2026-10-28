// Client–server: one socket.io connection; every request is {name, payload} with an ack. Identity rides in the handshake.
import { io } from "socket.io-client"; import { handshake } from "./attest.js";
export const socket = io({ transports: ["websocket", "polling"], auth: (cb) => handshake().then((a) => cb(a ? { attest: a } : {})).catch(() => cb({})) });
export const reconnect = () => new Promise((resolve) => { socket.once("connect", () => resolve()); if (socket.connected) socket.disconnect(); socket.connect(); setTimeout(resolve, 4000); });
export function rpc(name, payload = {}, timeout = 30000) { return new Promise((resolve, reject) => socket.timeout(timeout).emit("rpc", { name, payload }, (err, res) => { if (err) return reject(new Error("no reply from server")); res?.ok ? resolve(res.data) : reject(new Error(res?.error || "request failed")); })); }
export function on(event, cb) { socket.on(event, cb); return () => socket.off(event, cb); }
export const when = (iso) => { if (!iso) return ""; const d = new Date(iso), now = new Date(); const same = d.toDateString() === now.toDateString(); return same ? d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : d.toLocaleDateString([], { month: "short", day: "numeric" }) + " " + d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }); };
