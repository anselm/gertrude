<script>
  import { session } from "../lib/session.svelte.js"; import { rpc, on, when } from "../lib/api.js"; import SignIn from "../lib/SignIn.svelte";
  import { tick } from "svelte"; import { route } from "../lib/router.svelte.js";
  // ?demo shows a sample transcript without signing in, so the look can be checked and shared.
  const DEMO = [{ id: "d1", dir: "out", text: "Hello, I'm Gertrude. I should say straight away that I'm a digital person, a program, run by Anselm Hook here in Portland as a public service. I talk to people, I keep notes you can read and delete, and when I think two people ought to meet I ask them both first. So, what are you up to these days?", ts: "2026-10-27T18:00:00Z", channel: "web" }, { id: "d2", dir: "in", text: "Mostly fixing up an old sailboat and trying to find someone who knows diesel engines.", ts: "2026-10-27T18:01:00Z", channel: "web" }, { id: "d3", dir: "out", text: "A sailboat. What sort, and where does she live? And is it the engine that is beating you, or the finding of a person?", ts: "2026-10-27T18:01:20Z", channel: "web" }];
  const demo = $derived(route.q.has("demo"));
  // Arrived by an invitation link: remember the token across the sign-in redirect, show who sent it, redeem on first history load.
  const KEY = "gt_invite"; let via = $state(null);
  const m = route.path.match(/^\/i\/([a-z0-9]{8,16})$/); if (m) { try { localStorage.setItem(KEY, m[1]); } catch {} }
  const token = () => { try { return localStorage.getItem(KEY) || ""; } catch { return ""; } };
  $effect(() => { const t = token(); if (t && !session.user) rpc("invite.peek", { token: t }).then((j) => (via = j.used ? null : j)).catch(() => { via = null; try { localStorage.removeItem(KEY); } catch {} }); });
  let events = $state([]), text = $state(""), busy = $state(false), live = $state(""), err = $state(""), box; let loadedFor = null;
  async function load() { try { const j = await rpc("talk.history", { invite: token() }); events = j.events; err = ""; if (j.via || token()) { try { localStorage.removeItem(KEY); } catch {} if (location.pathname.startsWith("/i/")) history.replaceState(null, "", "/"); } } catch (e) { err = e.message; } scroll(); }
  $effect(() => { if (session.user && loadedFor !== session.user.id) { loadedFor = session.user.id; load(); } });
  const off = on("token", (t) => { live += t; scroll(); }); $effect(() => () => off());
  async function scroll() { await tick(); window.scrollTo(0, document.body.scrollHeight); }
  async function send() { const t = text.trim(); if (!t || busy) return; busy = true; text = ""; live = ""; events = [...events, { id: "tmp", dir: "in", text: t, ts: new Date().toISOString(), channel: "web" }]; scroll();
    try { const out = await rpc("talk.say", { text: t }, 120000); events = [...events, out]; } catch (e) { err = e.message; } finally { live = ""; busy = false; scroll(); } }
  function key(e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }
</script>
{#if demo}
  <div class="flex flex-col pb-8">
    <p class="head mb-2">Sample transcript · not a real person</p>
    {#each DEMO as e, i (e.id)}
      <div class="card {e.dir === 'in' ? 'me' : 'her'} mb-3"><span class="stamp">{when(e.ts)}</span><div class="who">{e.dir === "in" ? "You" : "Gertrude"}</div><div class="text">{e.text}</div><span class="no">No. {i + 1}</span></div>
    {/each}
    <p class="type mt-4 text-[13px] text-dim">☞ <a class="text-brand" href="/">Sign in</a> to talk to her yourself.</p>
  </div>
{:else if !session.loaded}<p class="type pt-6 text-[13px] text-dim">one moment…</p>
{:else if !session.user}<SignIn {via} />
{:else}
  <div class="flex flex-col pb-28">
    {#each events as e, i (e.id)}
      <div class="card {e.dir === 'in' ? 'me' : 'her'} mb-3"><span class="stamp">{when(e.ts)}{e.channel !== "web" ? " · " + e.channel : ""}</span><div class="who">{e.dir === "in" ? (session.user.name || "You") : "Gertrude"}</div><div class="text">{e.text}</div><span class="no">No. {i + 1}</span></div>
    {/each}
    {#if live}<div class="card her mb-3"><div class="who">Gertrude</div><div class="text">{live}</div></div>{:else if busy}<div class="card her mb-3"><div class="who">Gertrude</div><div class="text text-dim">…</div></div>{/if}
    {#if err}<p class="type text-[13px] text-brand" role="alert">✗ {err}</p>{/if}
  </div>
  <form class="fixed inset-x-0 bottom-0 z-20 bg-paper px-4 double pb-[max(env(safe-area-inset-bottom),12px)] pt-2" onsubmit={(e) => { e.preventDefault(); send(); }}>
    <div class="mx-auto flex max-w-3xl items-end gap-2 pr-12 md:pr-0">
      <textarea bind:this={box} bind:value={text} onkeydown={key} rows="1" placeholder="say something to Gertrude" class="min-h-[38px] max-h-40 flex-1 resize-none" aria-label="your message"></textarea>
      <button class="btn primary h-[38px]" disabled={busy || !text.trim()} aria-label="send">Send</button>
    </div>
  </form>
{/if}
