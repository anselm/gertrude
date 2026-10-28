<script>
  import { session } from "../lib/session.svelte.js"; import { rpc, when } from "../lib/api.js"; import SignIn from "../lib/SignIn.svelte";
  let card = $state(null), consents = $state([]), person = $state(null), err = $state(""), busy = $state(""), name = $state(""), edit = $state(false), draft = $state("");
  async function load() { try { const j = await rpc("card.get"); card = j.card; consents = j.consents; person = j.person; name = j.person.name || ""; err = ""; } catch (e) { err = e.message; } }
  $effect(() => { if (session.user) load(); });
  const lists = [["needs", "what you could use"], ["offers", "what you can give"], ["interests", "what you care about"], ["people_in_kind", "who you would like to meet"], ["open_threads", "what she means to come back to"]];
  async function saveName() { busy = "name"; try { await rpc("me.setName", { name }); session.user = { ...session.user, name }; } catch (e) { err = e.message; } busy = ""; }
  async function rethink() { busy = "think"; try { card = (await rpc("card.rethink", {}, 180000)).card; } catch (e) { err = e.message; } busy = ""; }
  function startEdit() { const { _updated, _through, _by, ...c } = card || {}; draft = JSON.stringify(c, null, 2); edit = true; }
  async function saveEdit() { busy = "edit"; try { card = (await rpc("card.set", { card: JSON.parse(draft) })).card ?? (await rpc("card.get")).card; edit = false; err = ""; } catch (e) { err = e.message; } busy = ""; }
  async function forget() { if (!confirm("Delete everything Gertrude holds about you: the conversation, the card, consents. This cannot be undone.")) return; busy = "forget"; try { await rpc("me.forget"); const { logout } = await import("../lib/session.svelte.js"); await logout(); location.assign("/"); } catch (e) { err = e.message; busy = ""; } }
</script>
{#if !session.loaded}<p class="pt-10 text-sm text-dim">one moment…</p>
{:else if !session.user}<SignIn why="to see your card" />
{:else}
  <h1 class="text-lg font-semibold">Your card</h1>
  <p class="mt-1 text-sm text-dim">What Gertrude holds about you, rewritten in her own words after you talk. Nothing here is shown to anyone without your yes. Correct it, or delete everything.</p>
  <div class="mt-5 flex items-center gap-2"><label class="text-sm text-dim" for="nm">name</label><input id="nm" bind:value={name} class="w-48 text-sm" /><button class="btn" disabled={busy === "name" || name === (person?.name || "")} onclick={saveName}>save</button></div>
  {#if err}<p class="mt-3 text-sm text-brand" role="alert">{err}</p>{/if}
  {#if !card}
    <p class="mt-6 text-[15px]">No card yet. She writes one a few minutes after you stop talking{session.stats ? "" : ""}. <button class="text-brand" disabled={!!busy} onclick={rethink}>{busy === "think" ? "writing…" : "write it now"}</button></p>
  {:else if edit}
    <textarea bind:value={draft} rows="24" class="mt-5 w-full font-mono text-xs"></textarea>
    <div class="mt-2 flex gap-2"><button class="btn primary" disabled={busy === "edit"} onclick={saveEdit}>save</button><button class="btn" onclick={() => (edit = false)}>cancel</button></div>
  {:else}
    <p class="mt-5 text-[15px] leading-relaxed">{card.summary}</p>
    {#each lists as [k, label]}{#if card[k]?.length}<h2 class="mt-5 text-sm text-dim">{label}</h2><ul class="mt-1 disc pl-5 text-[15px] leading-relaxed">{#each card[k] as x}<li>{x}</li>{/each}</ul>{/if}{/each}
    {#if card.facts?.length}<h2 class="mt-5 text-sm text-dim">things you told her</h2><ul class="mt-1 space-y-1 text-[15px]">{#each card.facts as f}<li>{f.text} <span class="text-dim text-sm">“{f.quote}”</span> {#if !f.public}<span class="chip">private</span>{/if}</li>{/each}</ul>{/if}
    {#if card.keep_private?.length}<h2 class="mt-5 text-sm text-dim">kept out of her notes at your request</h2><ul class="mt-1 disc pl-5 text-[15px] text-dim">{#each card.keep_private as x}<li>{x}</li>{/each}</ul>{/if}
    <p class="mt-6 text-xs text-dim">last written {when(card._updated)} by {card._by}. <button class="text-brand" onclick={startEdit}>edit as text</button> · <button class="text-brand" disabled={!!busy} onclick={rethink}>{busy === "think" ? "rewriting…" : "ask her to rewrite it"}</button></p>
  {/if}
  <div class="mt-12 border-t border-dim/20 pt-4">
    <button class="text-sm text-brand" disabled={!!busy} onclick={forget}>{busy === "forget" ? "deleting…" : "delete everything about me"}</button>
    <p class="mt-1 text-xs text-dim">Removes the conversation, this card and any consents at once. Your attest key is yours and stays on attest.</p>
  </div>
{/if}
