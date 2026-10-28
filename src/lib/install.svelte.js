// Installing Gertrude as a web app is the minimum bar for her to reach people (Web Push needs it on iPhone). Chrome and Edge
// fire beforeinstallprompt, which we keep and replay from a button; Safari on iPhone has no prompt, only instructions.
export const install = $state({ prompt: null, standalone: false, ios: false, done: false });
try { install.standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true; install.ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1); } catch {}
window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); install.prompt = e; });
window.addEventListener("appinstalled", () => { install.done = true; install.prompt = null; });
// What to tell the server (and so Gertrude) about this device, in words: "iPhone, Safari, not installed".
export function describe() { const ua = navigator.userAgent; const browser = /CriOS/.test(ua) ? "Chrome" : /FxiOS/.test(ua) ? "Firefox" : /EdgiOS|Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "a browser"; const os = install.ios ? "iPhone" : /Android/.test(ua) ? "Android" : /Mac/.test(ua) ? "Mac" : /Windows/.test(ua) ? "Windows" : /Linux/.test(ua) ? "Linux" : "unknown"; return `${os}, ${browser}, ${install.standalone ? "installed on the home screen" : "in the browser, not installed"}${install.prompt ? ", install prompt available" : ""}`; }
export const iosNotSafari = () => install.ios && /CriOS|FxiOS|EdgiOS/.test(navigator.userAgent);
export async function ask() { if (!install.prompt) return false; install.prompt.prompt(); const r = await install.prompt.userChoice; install.prompt = null; return r?.outcome === "accepted"; }
