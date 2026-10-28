<script>
  import { session } from "../lib/session.svelte.js"; import { rpc, when } from "../lib/api.js";
  let o = $state(null), err = $state(""), sel = $state(null), busy = $state("");
  async function load() { try { o = await rpc("admin.overview"); err = ""; } catch (e) { err = e.message; } }
  $effect(() => { if (session.user?.admin) load(); });
  async function open(id) { try { sel = await rpc("admin.person", { id }); } catch (e) { err = e.message; } }
  async function rethink(id) { busy = id; try { await rpc("admin.rethink", { id }, 180000); await open(id); } catch (e) { err = e.message; } busy = ""; }
  async function status(id, s) { try { await rpc("admin.status", { id, status: s }); await load(); if (sel) await open(id); } catch (e) { err = e.message; } }
</script>
{#if !session.user?.admin}<p class="pt-10 text-sm text-dim">admins only</p>
{:else if !o}<p class="pt-10 text-sm text-dim">{err || "loading…"}</p>
{:else}
  <h1 class="text-lg font-semibold">Admin</h1>
  <p class="mt-1 text-xs text-dim">talker {o.model.talker} · thinker {o.model.thinker} · {o.model.configured ? "key set" : "NO API KEY"} · 30 days: <span class="num">${o.total.cost}</span> over <span class="num">{o.total.n}</span> calls</p>
  {#if err}<p class="mt-2 text-sm text-brand">{err}</p>{/if}
  <h2 class="mt-5 text-sm text-dim">people ({o.people.length})</h2>
  <table class="mt-1 w-full text-sm"><tbody>
    {#each o.people as p}<tr class="border-t border-dim/15 {p.status !== 'active' ? 'opacity-50' : ''}"><td class="py-1"><button class="text-brand" onclick={() => open(p.id)}>{p.name || p.handle || p.id}</button> {#if p.role === "admin"}<span class="chip">admin</span>{/if}</td><td class="num text-dim">{p.events}</td><td class="text-dim text-xs">{when(p.last_event || p.last_seen)}</td><td class="text-right"><button class="chip" onclick={() => status(p.id, p.status === "active" ? "paused" : "active")}>{p.status === "active" ? "pause" : "resume"}</button></td></tr>{/each}
  </tbody></table>
  {#if sel}
    <div class="mt-6 rounded-[4px] bg-panel p-3">
      <div class="flex items-baseline justify-between"><h2 class="font-semibold">{sel.person.name || sel.person.handle || sel.person.id}</h2><button class="chip" disabled={busy === sel.person.id} onclick={() => rethink(sel.person.id)}>{busy ? "thinking…" : "rethink card"}</button></div>
      <p class="text-xs text-dim">{sel.person.did} · since {when(sel.person.created)}</p>
      {#if sel.card}<pre class="mt-2 max-h-72 overflow-auto whitespace-pre-wrap text-xs">{JSON.stringify(sel.card, null, 1)}</pre>{:else}<p class="mt-2 text-xs text-dim">no card yet</p>{/if}
      <div class="mt-3 flex flex-col gap-1">{#each sel.events as e}<div class="line text-sm {e.dir === 'in' ? 'me' : 'her'}" title={when(e.ts)}><span class="text-[10px] text-dim">{e.channel} {when(e.ts)}</span><br />{e.text}</div>{/each}</div>
    </div>
  {/if}
  <h2 class="mt-6 text-sm text-dim">costs, 30 days</h2>
  <table class="mt-1 w-full text-xs"><tbody>{#each o.costs as c}<tr class="border-t border-dim/15"><td class="py-1">{c.purpose}</td><td class="text-dim">{c.model}</td><td class="num">{c.n}</td><td class="num">{c.input}+{c.cached}c→{c.output}</td><td class="num text-right">${c.cost}</td></tr>{/each}</tbody></table>
  <p class="mt-4 text-xs text-dim">db {o.db}</p>
{/if}
