// Installing Gertrude as a web app is the minimum bar for her to reach people (Web Push needs it on iPhone). Chrome and Edge
// fire beforeinstallprompt, which we keep and replay from a button; Safari on iPhone has no prompt, only instructions.
export const install = $state({ prompt: null, standalone: false, ios: false, done: false });
try { install.standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true; install.ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1); } catch {}
window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); install.prompt = e; });
window.addEventListener("appinstalled", () => { install.done = true; install.prompt = null; });
export async function ask() { if (!install.prompt) return false; install.prompt.prompt(); const r = await install.prompt.userChoice; install.prompt = null; return r?.outcome === "accepted"; }
