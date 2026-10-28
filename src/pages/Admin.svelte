<script>
  import { session } from "../lib/session.svelte.js"; import { rpc, when } from "../lib/api.js";
  let o = $state(null), err = $state(""), sel = $state(null), busy = $state(""), nz = $state(null), ix = $state(null);
  async function load() { try { o = await rpc("admin.overview"); nz = await rpc("admin.nudges"); ix = await rpc("admin.intros"); err = ""; } catch (e) { err = e.message; } }
  async function decideIntro(id, action) { try { await rpc("admin.intro.decide", { id, action }); await load(); } catch (e) { err = e.message; } }
  async function match(id) { busy = id ? "m" + id : "match"; try { const r = await rpc("admin.match", id ? { id } : {}, 600000); err = r.skipped ? "skipped: " + r.skipped : r.result ? "review: " + r.result.map((x) => x[1]).join("; ") : ""; await load(); } catch (e) { err = e.message; } busy = ""; }
  async function decide(id, action) { try { await rpc("admin.nudge.decide", { id, action }); await load(); } catch (e) { err = e.message; } }
  async function propose(id) { busy = "n" + id; try { const r = await rpc("admin.nudge.propose", { id }, 120000); err = r.skipped ? "skipped: " + r.skipped : ""; await load(); } catch (e) { err = e.message; } busy = ""; }
  async function review() { busy = "review"; try { await rpc("admin.nudge.review", {}, 300000); await load(); } catch (e) { err = e.message; } busy = ""; }
  async function days(id, cur) { const d = prompt("Nudge at most every N days for this person (0.25–90):", cur ?? 7); if (!d) return; try { await rpc("admin.nudge.days", { id, days: Number(d) }); await load(); if (sel) await open(id); } catch (e) { err = e.message; } }
  $effect(() => { if (session.user?.admin) load(); });
  async function open(id) { try { sel = await rpc("admin.person", { id }); } catch (e) { err = e.message; } }
  async function rethink(id) { busy = id; try { await rpc("admin.rethink", { id }, 180000); await open(id); } catch (e) { err = e.message; } busy = ""; }
  async function status(id, s) { try { await rpc("admin.status", { id, status: s }); await load(); if (sel) await open(id); } catch (e) { err = e.message; } }
</script>
{#if !session.user?.admin}<p class="type pt-6 text-[13px] text-dim">admins only</p>
{:else if !o}<p class="type pt-6 text-[13px] text-dim">{err || "loading…"}</p>
{:else}
  <h1 class="mt-2">Directory</h1>
  <p class="type mt-1 text-[11px] uppercase tracking-[0.1em] text-dim">talker {o.model.talker} · thinker {o.model.thinker} · {o.model.configured ? "key set" : "NO API KEY"} · 30 days: <span class="num">${o.total.cost}</span> over <span class="num">{o.total.n}</span> calls</p>
  {#if err}<p class="mt-2 text-sm text-brand">{err}</p>{/if}
  <div class="hair mt-3"></div><h2 class="mt-3">People · {o.people.length}</h2>
  <table class="type mt-1 w-full text-[13px]"><tbody>
    {#each o.people as p}<tr class="hair {p.status !== 'active' ? 'opacity-50' : ''}"><td class="py-1"><button class="text-brand" onclick={() => open(p.id)}>{p.name || p.handle || p.id}</button> {#if p.role === "admin"}<span class="chip">admin</span>{/if}</td><td class="num text-dim">{p.events}</td><td class="text-dim text-xs">{when(p.last_event || p.last_seen)}</td><td class="text-right whitespace-nowrap"><button class="chip" title="nudge interval, days" onclick={() => days(p.id, p.nudge_days)}>{p.nudge_days ?? 7}d</button> <button class="chip" disabled={busy === "n" + p.id} onclick={() => propose(p.id)}>{busy === "n" + p.id ? "…" : "nudge?"}</button> <button class="chip" disabled={busy === "m" + p.id} onclick={() => match(p.id)}>{busy === "m" + p.id ? "…" : "match?"}</button> <button class="chip" onclick={() => status(p.id, p.status === "active" ? "paused" : "active")}>{p.status === "active" ? "pause" : "resume"}</button></td></tr>{/each}
  </tbody></table>
  {#if sel}
    <div class="card plain mt-6 !pb-3" style="border-top-color: var(--color-ink)">
      <div class="flex items-baseline justify-between"><h2 class="pt-2">{sel.person.name || sel.person.handle || sel.person.id}</h2><button class="chip" disabled={busy === sel.person.id} onclick={() => rethink(sel.person.id)}>{busy ? "thinking…" : "rethink card"}</button></div>
      <p class="text-xs text-dim">{sel.person.did} · since {when(sel.person.created)}</p>
      {#if sel.card}<pre class="type mt-2 max-h-72 overflow-auto whitespace-pre-wrap text-[11px]">{JSON.stringify(sel.card, null, 1)}</pre>{:else}<p class="mt-2 text-xs text-dim">no card yet</p>{/if}
      <div class="mt-3 flex flex-col gap-1">{#each sel.events as e}<div class="type text-[13px] py-1 hair" title={when(e.ts)}><span class="text-[10px] text-dim uppercase tracking-[0.08em]">{e.dir === "in" ? "them" : "gertrude"} · {e.channel} · {when(e.ts)}</span><br />{e.text}</div>{/each}</div>
    </div>
  {/if}
  {#if nz}
    <div class="hair mt-6"></div><div class="flex items-baseline justify-between"><h2 class="mt-3">Nudges · {nz.nudges.filter((n) => n.state === "proposed").length} waiting</h2><span class="type text-[10px] text-dim">{nz.channels} channels · quiet {nz.quiet.from}–{nz.quiet.to} {nz.quiet.tz}{nz.now_quiet ? " (quiet now)" : ""} · <button class="text-brand" disabled={busy === "review"} onclick={review}>{busy === "review" ? "reviewing…" : "review everyone now"}</button></span></div>
    {#if nz.nudges.length}<table class="type mt-1 w-full text-[12px]"><tbody>{#each nz.nudges as n}<tr class="hair align-top"><td class="py-1 pr-2 whitespace-nowrap">{n.person_name || n.person_handle}<br /><span class="text-dim text-[10px]">{when(n.created)} · {n.kind}</span></td><td class="py-1 pr-2">“{n.text}”<br /><span class="text-dim text-[11px]">{n.reason}</span></td><td class="py-1 text-right whitespace-nowrap">{#if n.state === "proposed"}<button class="chip" style="color: var(--color-avocado); border-color: var(--color-avocado)" onclick={() => decide(n.id, "approve")}>✓ approve</button> <button class="chip" onclick={() => decide(n.id, "decline")}>✗ decline</button>{:else}<span class="chip">{n.state}</span>{/if}</td></tr>{/each}</tbody></table>{:else}<p class="type mt-1 text-[12px] text-dim">none yet</p>{/if}
  {/if}
  {#if ix}
    <div class="hair mt-6"></div><div class="flex items-baseline justify-between"><h2 class="mt-3">Introductions · {ix.intros.filter((i) => i.state === "proposed").length} waiting</h2><span class="type text-[10px] text-dim">shortlist {ix.model} · <button class="text-brand" disabled={busy === "match"} onclick={() => match()}>{busy === "match" ? "matching…" : "match everyone now"}</button></span></div>
    <p class="type mt-1 text-[11px] uppercase tracking-[0.1em] text-dim">funnel · proposed <span class="num">{ix.funnel.proposed || 0}</span> · approved <span class="num">{ix.funnel.approved || 0}</span> · declined <span class="num">{ix.funnel.declined || 0}</span> · dropped <span class="num">{ix.funnel.dropped || 0}</span> · made <span class="num">{ix.funnel.made || 0}</span> · met <span class="num">{ix.funnel.outcomes.met}</span> · useful <span class="num">{ix.funnel.outcomes.useful}</span> · nothing <span class="num">{ix.funnel.outcomes.nothing}</span></p>
    {#if ix.intros.length}<table class="type mt-1 w-full text-[12px]"><tbody>{#each ix.intros as i}<tr class="hair align-top"><td class="py-1 pr-2 whitespace-nowrap">{i.a_name || i.a_handle} ↔ {i.b_name || i.b_handle}<br /><span class="text-dim text-[10px]">{when(i.created)}{i.score != null ? " · " + i.score : ""}</span></td><td class="py-1 pr-2"><span class="text-dim text-[11px]">{i.why}</span><br />→ {i.a_name || i.a_handle}: “{i.ask_a}” <span class="text-dim">{i.a_answer || ""}{i.a_reach ? " · " + i.a_reach : ""}</span><br />→ {i.b_name || i.b_handle}: “{i.ask_b}” <span class="text-dim">{i.b_answer || ""}{i.b_reach ? " · " + i.b_reach : ""}</span></td><td class="py-1 text-right whitespace-nowrap">{#if i.state === "proposed"}<button class="chip" style="color: var(--color-avocado); border-color: var(--color-avocado)" onclick={() => decideIntro(i.id, "approve")}>✓ approve</button> <button class="chip" onclick={() => decideIntro(i.id, "decline")}>✗ decline</button>{:else}<span class="chip">{i.state}</span>{/if}</td></tr>{/each}</tbody></table>{:else}<p class="type mt-1 text-[12px] text-dim">none yet; she needs two cards that fit</p>{/if}
  {/if}
  <div class="hair mt-6"></div><h2 class="mt-3">Costs · 30 days</h2>
  <table class="type mt-1 w-full text-[12px]"><tbody>{#each o.costs as c}<tr class="hair"><td class="py-1">{c.purpose}</td><td class="text-dim">{c.model}</td><td class="num">{c.n}</td><td class="num">{c.input}+{c.cached}c→{c.output}</td><td class="num text-right">${c.cost}</td></tr>{/each}</tbody></table>
  <p class="type mt-4 text-[11px] text-dim">db {o.db}</p>
{/if}
