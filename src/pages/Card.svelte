<script>
  import { session } from "../lib/session.svelte.js"; import { rpc, when } from "../lib/api.js"; import SignIn from "../lib/SignIn.svelte";
  let card = $state(null), consents = $state([]), person = $state(null), err = $state(""), busy = $state(""), name = $state(""), edit = $state(false), draft = $state("");
  async function load() { try { const j = await rpc("card.get"); card = j.card; consents = j.consents; person = j.person; name = j.person.name || ""; err = ""; } catch (e) { err = e.message; } }
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
  <div class="mt-6 flex items-baseline gap-3">
    <button class="btn" disabled={!!busy} onclick={forget}>{busy === "forget" ? "deleting…" : "✗ Delete everything about me"}</button>
    <p class="type text-[11px] text-dim">Removes the conversation, this card and any consents at once. Your key stays yours, on attest.</p>
  </div>
{/if}
