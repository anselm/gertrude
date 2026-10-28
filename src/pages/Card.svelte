<script>
  import { session } from "../lib/session.svelte.js"; import { rpc, when } from "../lib/api.js"; import SignIn from "../lib/SignIn.svelte";
  let card = $state(null), consents = $state([]), person = $state(null), err = $state(""), busy = $state(""), name = $state(""), edit = $state(false), draft = $state(""), leads = $state([]), edges = $state([]), newName = $state(""), copied = $state(""), shown = $state("");
  async function load() { try { const j = await rpc("card.get"); card = j.card; consents = j.consents; person = j.person; name = j.person.name || ""; err = ""; const l = await rpc("leads.list"); leads = l.leads; edges = l.edges; } catch (e) { err = e.message; } }
  async function copy(link, id) { try { await navigator.clipboard.writeText(link); copied = id; setTimeout(() => (copied = ""), 1500); } catch { prompt("copy this link", link); } }
  // Send the invitation yourself: the phone's share sheet (Messages, WhatsApp, mail) with a note from her; copy as the fallback.
  const note = (l) => `${l.name}, this is ${person?.name || "a friend"}. There's a digital person called Gertrude who connects people in Portland; I told her you ought to talk. She's a program, she keeps notes you can read and delete, and she'll only know I sent you. Say hello: ${l.link}`;
  async function send(l) { if (navigator.share) { try { await navigator.share({ text: note(l) }); return; } catch (e) { if (e?.name === "AbortError") return; } } copy(note(l), l.id); }
  async function invite() { const n = newName.trim(); if (!n) return; busy = "invite"; try { await rpc("invite.make", { name: n, about: "" }); newName = ""; await load(); } catch (e) { err = e.message; } busy = ""; }
  $effect(() => { if (session.user) load(); });
  const lists = [["needs", "What you could use"], ["offers", "What you can give"], ["interests", "What you care about"], ["people_in_kind", "Who you would like to meet"], ["open_threads", "What she means to come back to"]];
  async function saveName() { busy = "name"; try { await rpc("me.setName", { name }); session.user = { ...session.user, name }; } catch (e) { err = e.message; } busy = ""; }
  async function rethink() { busy = "think"; try { card = (await rpc("card.rethink", {}, 180000)).card; } catch (e) { err = e.message; } busy = ""; }
  function startEdit() { const { _updated, _through, _by, ...c } = card || {}; draft = JSON.stringify(c, null, 2); edit = true; }
  async function saveEdit() { busy = "edit"; try { await rpc("card.set", { card: JSON.parse(draft) }); await load(); edit = false; err = ""; } catch (e) { err = e.message; } busy = ""; }
  async function forget() { if (!confirm("Delete everything Gertrude holds about you: the conversation, the card, consents. This cannot be undone.")) return; busy = "forget"; try { await rpc("me.forget"); const { logout } = await import("../lib/session.svelte.js"); await logout(); location.assign("/"); } catch (e) { err = e.message; busy = ""; } }
  const fmt = (iso) => iso ? new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "";
</script>
{#if !session.loaded}<p class="type pt-6 text-[13px] text-dim">one moment…</p>
{:else if !session.user}<SignIn why="to see your card" />
{:else}
  <div class="card mt-2 !pb-4" style="border-top-color: var(--color-ink)">
    <div class="flex items-baseline justify-between pt-1"><span class="head">Form G-1 · Card on file</span><span class="type text-[10px] text-dim uppercase tracking-[0.08em]">Rev. {fmt(card?._updated) || "—"} · by {card?._by || "—"}</span></div>
    <div class="hair mt-1"></div>
    <div class="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 md:grid-cols-2">
      <div class="field"><span class="k">1. Name</span><input bind:value={name} class="!border-0 !border-b !bg-transparent !px-1 !py-0 flex-1 text-[14px]" /><button class="chip" disabled={busy === "name" || name === (person?.name || "")} onclick={saveName}>save</button></div>
      <div class="field"><span class="k">2. Attest</span><span class="dots"></span><span>{person?.handle || "—"}</span></div>
      <div class="field"><span class="k">3. On file since</span><span class="dots"></span><span>{fmt(person?.created)}</span></div>
      <div class="field"><span class="k">4. Consents</span><span class="dots"></span><span>{consents.filter((c) => !c.revoked_at).map((c) => c.kind).join(", ") || "none yet"}</span></div>
    </div>
    {#if err}<p class="type mt-3 text-[13px] text-brand" role="alert">✗ {err}</p>{/if}
    {#if !card}
      <p class="body mt-5">No card yet. She writes one a few minutes after you stop talking. <button class="chip" disabled={!!busy} onclick={rethink}>{busy === "think" ? "writing…" : "write it now"}</button></p>
    {:else if edit}
      <textarea bind:value={draft} rows="24" class="mt-4 w-full text-[12px]"></textarea>
      <div class="mt-2 flex gap-2"><button class="btn primary" disabled={busy === "edit"} onclick={saveEdit}>Save</button><button class="btn" onclick={() => (edit = false)}>Cancel</button></div>
    {:else}
      <p class="head mt-5">5. In her words</p>
      <p class="body mt-1">{card.summary}</p>
      <div class="cols-2 mt-4">
        {#each lists as [k, label], i}{#if card[k]?.length}<div class="mb-3 break-inside-avoid"><p class="head">{i + 6}. {label}</p><ul class="sq body mt-1">{#each card[k] as x}<li>{x}</li>{/each}</ul></div>{/if}{/each}
      </div>
      {#if card.facts?.length}<p class="head mt-2">11. Things you told her</p><ul class="sq body mt-1 cols-2">{#each card.facts as f}<li class="break-inside-avoid">{f.text} <span class="text-dim">“{f.quote}”</span> {#if !f.public}<span class="chip">private</span>{/if}</li>{/each}</ul>{/if}
      {#if card.keep_private?.length}<p class="head mt-4">12. Kept out of her notes at your request</p><ul class="sq body mt-1 text-dim">{#each card.keep_private as x}<li>{x}</li>{/each}</ul>{/if}
      <div class="hair mt-5"></div>
      <p class="type mt-2 text-[12px] text-dim">☞ <button class="text-brand" onclick={startEdit}>edit as text</button> · <button class="text-brand" disabled={!!busy} onclick={rethink}>{busy === "think" ? "rewriting…" : "ask her to rewrite it"}</button></p>
    {/if}
  </div>
  <div class="card mt-5 !pb-4" style="border-top-color: var(--color-gold)">
    <div class="flex items-baseline justify-between pt-1"><span class="head">Form G-2 · People you have pointed her at</span><span class="type text-[10px] text-dim uppercase tracking-[0.08em]">{leads.length} named · {edges.length} arrived</span></div>
    <div class="hair mt-1"></div>
    <p class="body mt-2 text-dim">Each is a note with a one-time link, for you to send on yourself by text, Discord, email, whatever you use. She never contacts anyone first. When they arrive they hear that you sent them, nothing else.</p>
    {#if leads.length}<table class="type mt-2 w-full text-[13px]"><tbody>{#each leads as l}<tr class="hair"><td class="py-1 pr-2">{l.name}</td><td class="text-dim text-[11px] pr-2">{l.about}</td><td class="text-right whitespace-nowrap align-top py-1">{#if l.arrived}<span class="chip" style="color: var(--color-avocado); border-color: var(--color-avocado)">✓ arrived</span>{:else if l.link}<button class="chip" style="color: var(--color-brand); border-color: var(--color-brand)" onclick={() => send(l)}>☞ send</button> <button class="chip" onclick={() => copy(note(l), l.id)}>{copied === l.id ? "copied" : "copy note"}</button> <button class="chip" onclick={() => (shown = shown === l.id ? "" : l.id)}>{shown === l.id ? "hide" : "show"}</button>{:else}<span class="chip">noted</span>{/if}</td></tr>{#if shown === l.id && l.link}<tr><td colspan="3" class="pb-2"><div class="card !pb-2 !pt-1 select-all text-[13px] leading-6" style="border-top-color: var(--color-gold)">{note(l)}</div><p class="type text-[10px] text-dim mt-1">Select it and paste anywhere: text, Discord, email. The link works once.</p></td></tr>{/if}{/each}</tbody></table>{/if}
    <div class="mt-3 flex items-baseline gap-2"><input bind:value={newName} placeholder="a friend's first name" class="flex-1 text-[13px] !py-1" onkeydown={(e) => e.key === "Enter" && invite()} /><button class="btn" disabled={busy === "invite" || !newName.trim()} onclick={invite}>☞ Make a link</button></div>
  </div>
  <div class="mt-6 flex items-baseline gap-3">
    <button class="btn" disabled={!!busy} onclick={forget}>{busy === "forget" ? "deleting…" : "✗ Delete everything about me"}</button>
    <p class="type text-[11px] text-dim">Removes the conversation, this card and any consents at once. Your key stays yours, on attest.</p>
  </div>
{/if}
