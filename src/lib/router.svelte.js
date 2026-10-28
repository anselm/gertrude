// Tiny path router: state is the pathname; links call go(); server falls back to index.html. A forward navigation starts at the
// top; back and forward (popstate) leave the scroll alone, so a page that remembers itself (the feed) can put the reader back
// where they were. The browser's own restoration is off because the page is rebuilt, not reloaded.
try { history.scrollRestoration = "manual"; } catch {}
export const route = $state({ path: location.pathname, q: new URLSearchParams(location.search), back: false });
export const left = { y: 0 }; // where the page being left was scrolled to, taken before anything moves; its teardown reads it
export function go(path) { left.y = window.scrollY; history.pushState(null, "", path); route.back = false; sync(); window.scrollTo(0, 0); }
function sync() { route.path = location.pathname; route.q = new URLSearchParams(location.search); }
window.addEventListener("popstate", () => { left.y = window.scrollY; route.back = true; sync(); });
document.addEventListener("click", (e) => { const a = e.target.closest("a[href^='/']"); if (a && !a.target && !e.metaKey && !e.ctrlKey) { e.preventDefault(); go(a.getAttribute("href")); } });
