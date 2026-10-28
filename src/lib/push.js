// Web Push from the person's own browser: register the service worker, ask permission, subscribe with the server's VAPID key,
// hand the subscription to the server as a channel. On iPhone this works only once the site is on the Home Screen.
import { rpc } from "./api.js";
export const supported = () => "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
export const standalone = () => { try { return matchMedia("(display-mode: standalone)").matches || navigator.standalone === true; } catch { return false; } };
export const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
export async function register() { if (!("serviceWorker" in navigator)) return null; try { return await navigator.serviceWorker.register("/sw.js"); } catch { return null; } }
const b64ToU8 = (s) => { const pad = "=".repeat((4 - (s.length % 4)) % 4); const raw = atob((s + pad).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from([...raw].map((c) => c.charCodeAt(0))); };
export async function current() { const reg = await navigator.serviceWorker?.getRegistration(); return reg ? reg.pushManager.getSubscription() : null; }
export async function enable() { if (!supported()) throw new Error("this browser cannot receive push" + (isIOS() && !standalone() ? "; on iPhone add Gertrude to your Home Screen first (share button, then Add to Home Screen) and open her from there" : ""));
  const { key, configured } = await rpc("push.key"); if (!configured) throw new Error("push is not set up on the server yet");
  const reg = (await register()) || (await navigator.serviceWorker.ready); const perm = await Notification.requestPermission(); if (perm !== "granted") throw new Error("notifications were not allowed");
  const sub = (await reg.pushManager.getSubscription()) || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToU8(key) }));
  return rpc("channel.add", { kind: "webpush", address: sub.toJSON(), label: (isIOS() ? "iPhone" : navigator.userAgentData?.platform || navigator.platform || "browser") });
}
export async function disable(id) { try { const sub = await current(); await sub?.unsubscribe(); } catch {} return rpc("channel.remove", { id }); }
