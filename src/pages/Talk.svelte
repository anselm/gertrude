<script>
  import { session } from "../lib/session.svelte.js"; import { rpc, on, when } from "../lib/api.js"; import SignIn from "../lib/SignIn.svelte";
  import { tick } from "svelte"; import { route } from "../lib/router.svelte.js";
  // ?demo shows a sample transcript without signing in, so the look can be checked and shared.
  const DEMO = [{ id: "d1", dir: "out", text: "Hello, I'm Gertrude. I should say straight away that I'm a digital person, a program, run by Anselm Hook here in Portland as a public service. I talk to people, I keep notes you can read and delete, and when I think two people ought to meet I ask them both first. So, what are you up to these days?", ts: "2026-10-27T18:00:00Z", channel: "web" }, { id: "d2", dir: "in", text: "Mostly fixing up an old sailboat and trying to find someone who knows diesel engines.", ts: "2026-10-27T18:01:00Z", channel: "web" }, { id: "d3", dir: "out", text: "A sailboat. What sort, and where does she live? And is it the engine that is beating you, or the finding of a person?", ts: "2026-10-27T18:01:20Z", channel: "web" }];
  const demo = $derived(route.q.has("demo"));
  let events = $state([]), text = $state(""), busy = $state(false), live = $state(""), err = $state(""), box; let loadedFor = null;
  async function load() { try { const j = await rpc("talk.history"); events = j.events; err = ""; } catch (e) { err = e.message; } scroll(); }
  $effect(() => { if (session.user && loadedFor !== session.user.id) { loadedFor = session.user.id; load(); } });
  const off = on("token", (t) => { live += t; scroll(); }); $effect(() => () => off());
  async function scroll() { await tick(); window.scrollTo(0, document.body.scrollHeight); }
  async function send() { const t = text.trim(); if (!t || busy) return; busy = true; text = ""; live = ""; events = [...events, { id: "tmp", dir: "in", text: t, ts: new Date().toISOString(), channel: "web" }]; scroll();
    try { const out = await rpc("talk.say", { text: t }, 120000); events = [...events, out]; } catch (e) { err = e.message; } finally { live = ""; busy = false; scroll(); } }
  function key(e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }
</script>
{#if demo}
  <div class="flex flex-col pb-8">
    {#each DEMO as e, i (e.id)}
      {#if i === 0 || DEMO[i - 1].dir !== e.dir}<div class="rule mt-2"></div>{/if}
      <div class="line {e.dir === 'in' ? 'me' : 'her'}"><span class="who">{e.dir === "in" ? "you" : "Gertrude"}</span>{e.text}</div>
    {/each}
    <p class="mt-6 text-sm text-dim">A sample. <a class="text-brand" href="/">Sign in</a> to talk to her yourself.</p>
  </div>
{:else if !session.loaded}<p class="pt-10 text-sm text-dim">one moment…</p>
{:else if !session.user}<SignIn />
{:else}
  <div class="flex flex-col pb-28">
    {#each events as e, i (e.id)}
      {#if i === 0 || events[i - 1].dir !== e.dir}<div class="rule mt-2"></div>{/if}
      <div class="line {e.dir === 'in' ? 'me' : 'her'}" title={when(e.ts) + (e.channel !== "web" ? " · " + e.channel : "")}><span class="who">{e.dir === "in" ? (session.user.name || "you") : "Gertrude"}</span>{e.text}</div>
    {/each}
    {#if live}<div class="rule mt-2"></div><div class="line her"><span class="who">Gertrude</span>{live}</div>{:else if busy}<div class="rule mt-2"></div><div class="line her text-dim"><span class="who">Gertrude</span>…</div>{/if}
    {#if err}<p class="text-sm text-brand" role="alert">{err}</p>{/if}
  </div>
  <form class="fixed inset-x-0 bottom-0 z-20 bg-paper px-4 rule-double pb-[max(env(safe-area-inset-bottom),12px)] pt-2" onsubmit={(e) => { e.preventDefault(); send(); }}>
    <div class="mx-auto flex max-w-2xl items-end gap-2">
      <textarea bind:this={box} bind:value={text} onkeydown={key} rows="1" placeholder="say something to Gertrude" class="min-h-[40px] max-h-40 flex-1 resize-none" aria-label="your message"></textarea>
      <button class="btn primary h-10" disabled={busy || !text.trim()} aria-label="send">send</button>
    </div>
  </form>
{/if}
