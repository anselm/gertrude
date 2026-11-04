<script>
  import { session } from "../lib/session.svelte.js"; import { rpc, when } from "../lib/api.js"; import SignIn from "../lib/SignIn.svelte"; import * as push from "../lib/push.js"; import Install from "../lib/Install.svelte";
  let myIntros = $state([]); let channels = $state([]), phoneOn = $state(null), phoneDraft = $state(""), phoneErr = $state(""), placeName = $state(""), topic = $state(""), reach = $state(""), myNudges = $state([]), cad = $state({ nudge_days: 7, quiet_from: 21, quiet_to: 8 });
  async function loadChannels() { try { const j = await rpc("channel.list"); channels = j.channels; phoneOn = j.phone || null; placeName = j.place; myNudges = j.nudges; cad = j.cadence; myIntros = (await rpc("intros.list")).intros; } catch {} }
  const CAD = [[0, "never"], [1, "daily at most"], [7, "weekly at most"], [14, "fortnightly"], [30, "monthly"]];
  async function saveCad() { try { cad = await rpc("cadence.set", cad); reach = "noted"; } catch (e) { reach = e.message; } }
  async function pushOn() { reach = "asking…"; try { await push.enable(); reach = "on"; await loadChannels(); } catch (e) { reach = e.message; } }
  async function pushOff(id) { reach = ""; try { await push.disable(id); await loadChannels(); } catch (e) { reach = e.message; } }
  async function ntfyOn() { reach = ""; try { await rpc("channel.add", { kind: "ntfy", address: { topic: topic.trim() }, label: "ntfy" }); topic = ""; await loadChannels(); } catch (e) { reach = e.message; } }
  async function dropChannel(id) { try { await rpc("channel.remove", { id }); await loadChannels(); } catch (e) { reach = e.message; } }
  async function testReach() { reach = "sending a test…"; try { await rpc("channel.test"); reach = "sent; did it arrive?"; } catch (e) { reach = e.message; } }
  function sharePlace() { if (!navigator.geolocation) { reach = "no location on this browser"; return; } reach = "asking for your location…"; navigator.geolocation.getCurrentPosition(async (pos) => { try { const j = await rpc("place.set", { lat: pos.coords.latitude, lon: pos.coords.longitude, tz: Intl.DateTimeFormat().resolvedOptions().timeZone }); placeName = j.place; reach = ""; } catch (e) { reach = e.message; } }, (e) => (reach = "location: " + e.message), { maximumAge: 600000, timeout: 15000 }); }
  async function forgetPlace() { try { await rpc("place.clear"); placeName = ""; } catch (e) { reach = e.message; } }
  let card = $state(null), consents = $state([]), person = $state(null), err = $state(""), busy = $state(""), name = $state(""), edit = $state(false), draft = $state(""), leads = $state([]), vouches = $state({ link: null, given: [], received: [] }), edges = $state([]), newName = $state(""), copied = $state(""), shown = $state("");
  async function load() { try { const j = await rpc("card.get"); card = j.card; consents = j.consents; person = j.person; name = j.person.name || ""; err = ""; const l = await rpc("leads.list"); try { vouches = await rpc("vouch.list"); } catch {} leads = l.leads; edges = l.edges; } catch (e) { err = e.message; } }
  async function copy(link, id) { try { await navigator.clipboard.writeText(link); copied = id; setTimeout(() => (copied = ""), 1500); } catch { prompt("copy this link", link); } }
  // Send the invitation yourself: the phone's share sheet (Messages, WhatsApp, mail) with a note from her; copy as the fallback.
  const note = (l) => `${l.name}, this is ${person?.name || "a friend"}. There's a digital person called Gertrude who connects people in Portland; I told her you ought to talk. She's a program, she keeps notes you can read and delete, and she'll only know I sent you. Say hello: ${l.link}`;
  // The telephone: one number, given with a sentence that stands as consent; removable.
  async function setPhone() { phoneErr = ""; try { const j = await rpc("phone.set", { number: phoneDraft, said: "You may ring me on this number (typed on the card page)" }); phoneOn = j.phone; phoneDraft = ""; if (j.merged) reach = "your earlier telephone conversation is now in your transcript"; } catch (e) { phoneErr = e.message; } }
  async function clearPhone() { try { await rpc("phone.clear"); phoneOn = null; } catch (e) { phoneErr = e.message; } }
  // Your standing link, with a note in your own name; the share sheet where there is one, the clipboard otherwise.
  async function shareLink() { const text = `${person?.name || "A friend"} here. Gertrude introduces people around Portland; she is a program, not a person, and I have vouched for you with her. Say hello to her here: ${vouches.link}`; if (navigator.share) { try { await navigator.share({ text }); return; } catch (e) { if (e?.name === "AbortError") return; } } copy(text, "vouchlink"); }
  async function send(l) { if (navigator.share) { try { await navigator.share({ text: note(l) }); return; } catch (e) { if (e?.name === "AbortError") return; } } copy(note(l), l.id); }
  async function invite() { const n = newName.trim(); if (!n) return; busy = "invite"; try { await rpc("invite.make", { name: n, about: "" }); newName = ""; await load(); } catch (e) { err = e.message; } busy = ""; }
  $effect(() => { if (session.user) { load(); loadChannels(); } });
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
  <div class="card plain mt-2 !pb-4" style="border-top-color: var(--color-ink)">
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
  <div class="card plain mt-5 !pb-4" style="border-top-color: var(--color-brand)">
    <div class="flex items-baseline justify-between pt-1"><span class="head">Form G-2 · Your link</span><span class="type text-[10px] text-dim uppercase tracking-[0.08em]">{vouches.given.length} vouched for</span></div>
    <div class="hair mt-1"></div>
    {#if vouches.link}
      <p class="body mt-2 text-dim">Hand this to anyone you vouch for. Whoever arrives by it is yours in her book: she greets them by way of you, and your word counts for them.</p>
      <p class="type mt-2 text-[13px] break-all select-all">{vouches.link}</p>
      <div class="mt-2 flex flex-wrap items-baseline gap-2"><button class="btn" onclick={shareLink}>☞ Send it</button><button class="chip" onclick={() => copy(vouches.link, "vouchlink")}>{copied === "vouchlink" ? "copied" : "copy"}</button></div>
    {:else}<p class="body mt-2 text-dim">Your sign-in carries no handle yet, so there is no link in your name; the one-time links below still work.</p>{/if}
    {#if vouches.given.length}<p class="head mt-3">You vouched for</p><p class="type text-[13px]">{vouches.given.map((v) => v.name).join(", ")}</p>{/if}
    {#if vouches.received.length}<p class="head mt-3">Vouched for you</p><p class="type text-[13px]">{vouches.received.map((v) => v.name).join(", ")}</p>{/if}
  </div>
  <div class="card plain mt-5 !pb-4" style="border-top-color: var(--color-gold)">
    <div class="flex items-baseline justify-between pt-1"><span class="head">Form G-3 · People you have pointed her at</span><span class="type text-[10px] text-dim uppercase tracking-[0.08em]">{leads.length} named · {edges.length} arrived</span></div>
    <div class="hair mt-1"></div>
    <p class="body mt-2 text-dim">Each is a note with a one-time link, for you to send on yourself by text, Discord, email, whatever you use. She never contacts anyone first. When they arrive they hear that you sent them, nothing else.</p>
    {#if leads.length}<table class="type mt-2 w-full text-[13px]"><tbody>{#each leads as l}<tr class="hair"><td class="py-1 pr-2">{l.name}</td><td class="text-dim text-[11px] pr-2">{l.about}</td><td class="text-right whitespace-nowrap align-top py-1">{#if l.arrived}<span class="chip" style="color: var(--color-avocado); border-color: var(--color-avocado)">✓ arrived</span>{:else if l.link}<button class="chip" style="color: var(--color-brand); border-color: var(--color-brand)" onclick={() => send(l)}>☞ send</button> <button class="chip" onclick={() => copy(note(l), l.id)}>{copied === l.id ? "copied" : "copy note"}</button> <button class="chip" onclick={() => (shown = shown === l.id ? "" : l.id)}>{shown === l.id ? "hide" : "show"}</button>{:else}<span class="chip">noted</span>{/if}</td></tr>{#if shown === l.id && l.link}<tr><td colspan="3" class="pb-2"><div class="card !pb-2 !pt-1 select-all text-[13px] leading-6" style="border-top-color: var(--color-gold)">{note(l)}</div><p class="type text-[10px] text-dim mt-1">Select it and paste anywhere: text, Discord, email. The link works once.</p></td></tr>{/if}{/each}</tbody></table>{/if}
    <div class="mt-3 flex items-baseline gap-2"><input bind:value={newName} placeholder="a friend's first name" class="flex-1 text-[13px] !py-1" onkeydown={(e) => e.key === "Enter" && invite()} /><button class="btn" disabled={busy === "invite" || !newName.trim()} onclick={invite}>☞ Make a link</button></div>
  </div>
  <div class="card plain mt-5 !pb-4" style="border-top-color: var(--color-avocado)">
    <div class="flex items-baseline justify-between pt-1"><span class="head">Form G-4 · How she may reach you</span><span class="type text-[10px] text-dim uppercase tracking-[0.08em]">{channels.length} way{channels.length === 1 ? "" : "s"}</span></div>
    <div class="hair mt-1"></div>
    <p class="body mt-2 text-dim">Gertrude reviews her notes and now and then has a suggestion: a follow-up, a question, someone in her circle who might help, in kind and unnamed until you say yes. You set how often, here or just by telling her.</p>
    <div class="mt-2 flex flex-wrap items-baseline gap-2 type text-[12px]"><span class="uppercase tracking-[0.08em] text-dim text-[11px]">Unprompted</span><select bind:value={cad.nudge_days} onchange={saveCad} class="!py-0.5 !text-[12px]">{#each CAD as [d, l]}<option value={d}>{l}</option>{/each}{#if !CAD.some(([d]) => d === cad.nudge_days)}<option value={cad.nudge_days}>every {cad.nudge_days} days</option>{/if}</select><span class="uppercase tracking-[0.08em] text-dim text-[11px]">quiet from</span><input type="number" min="0" max="23" bind:value={cad.quiet_from} onchange={saveCad} class="w-14 !py-0.5 !text-[12px]" /><span class="uppercase tracking-[0.08em] text-dim text-[11px]">to</span><input type="number" min="0" max="23" bind:value={cad.quiet_to} onchange={saveCad} class="w-14 !py-0.5 !text-[12px]" /><span class="text-dim text-[11px]">o'clock, your time</span></div>
    <div class="mt-3 flex flex-wrap items-baseline gap-2">
      {#if !channels.some((c) => c.kind === "webpush")}<button class="btn" onclick={pushOn} disabled={push.isIOS() && !push.standalone()}>☞ Turn on notifications</button>{#if push.isIOS() && !push.standalone()}<span class="type text-[11px] text-dim">first put her on your home screen, below</span>{/if}{/if}
      {#if channels.length}<button class="btn" onclick={testReach}>Send a test</button>{/if}
    </div>
    <Install />
    {#if channels.length}<table class="type mt-2 w-full text-[13px]"><tbody>{#each channels as c}<tr class="hair"><td class="py-1">{c.kind === "webpush" ? "notifications" : c.kind} · {c.label}</td><td class="text-dim text-[11px]">{c.last_sent ? "last " + when(c.last_sent) : "never used"}{c.failures ? " · " + c.failures + " failed" : ""}</td><td class="text-right"><button class="chip" onclick={() => (c.kind === "webpush" ? pushOff(c.id) : dropChannel(c.id))}>✗ off</button></td></tr>{/each}</tbody></table>{/if}
    <div class="mt-3 flex flex-wrap items-baseline gap-2"><span class="type text-[11px] uppercase tracking-[0.08em] text-dim">Telephone</span>
      {#if phoneOn}<span class="type text-[13px]">{phoneOn}</span><span class="type text-[11px] text-dim">she knows you when you ring her, and may ring you by appointment once she can</span><button class="chip" onclick={clearPhone}>✗ off</button>
      {:else}<input bind:value={phoneDraft} type="tel" inputmode="tel" autocomplete="tel" placeholder="your number" class="flex-1 min-w-[10rem] text-[13px] !py-1" onkeydown={(e) => e.key === "Enter" && setPhone()} /><button class="btn" disabled={!phoneDraft.trim()} onclick={setPhone}>☞ She may ring me here</button>{/if}
    </div>
    {#if phoneErr}<p class="type mt-1 text-[12px]" style="color: var(--color-rust)">{phoneErr}</p>{/if}
    <div class="mt-3 flex items-baseline gap-2"><span class="type text-[11px] uppercase tracking-[0.08em] text-dim">ntfy topic</span><input bind:value={topic} placeholder="if you use ntfy.sh" class="flex-1 text-[13px] !py-1" onkeydown={(e) => e.key === "Enter" && ntfyOn()} /><button class="btn" disabled={!topic.trim()} onclick={ntfyOn}>Add</button></div>
    <div class="hair mt-3"></div>
    <div class="mt-2 flex flex-wrap items-baseline gap-2"><span class="type text-[11px] uppercase tracking-[0.08em] text-dim">Where you are</span>{#if placeName}<span class="type text-[13px]">near {placeName}</span><button class="chip" onclick={forgetPlace}>✗ forget</button>{:else}<button class="btn" onclick={sharePlace}>☞ Share roughly where you are</button><span class="type text-[11px] text-dim">kept to about a kilometre, so she can think of nearby people and places</span>{/if}</div>
    {#if reach}<p class="type mt-2 text-[12px] text-brand" role="status">{reach}</p>{/if}
    {#if myNudges.length}<p class="head mt-3">What she has sent you unprompted</p><ul class="type mt-1 text-[12px]">{#each myNudges as n}<li class="hair py-1"><span class="text-dim">{when(n.sent || n.created)} · {n.state}</span> {n.text}</li>{/each}</ul>{/if}
  </div>
  {#if myIntros.length}
  <div class="card plain mt-5 !pb-4" style="border-top-color: var(--color-rust)">
    <div class="flex items-baseline justify-between pt-1"><span class="head">Form G-5 · Introductions</span><span class="type text-[10px] text-dim uppercase tracking-[0.08em]">{myIntros.filter((i) => i.state === "made").length} made</span></div>
    <div class="hair mt-1"></div>
    <p class="body mt-2 text-dim">When two cards fit she asks both people. Nobody is named until both have said yes, and what is handed over is only what each chose. Answer her in the conversation; this is the record.</p>
    <table class="type mt-2 w-full text-[13px]"><tbody>{#each myIntros as i}<tr class="hair align-top"><td class="py-1 pr-2 whitespace-nowrap text-dim text-[11px]">{when(i.made || i.created)}</td><td class="py-1">{#if i.state === "made"}<b>{i.other}</b> · {i.about_other} <span class="text-dim">reach: {i.reach}</span>{#if i.outcome} <span class="chip">{i.outcome}</span>{/if}{:else if i.state === "approved"}she asked: “{i.asked}” <span class="text-dim">· you: {i.mine || "no answer yet"} · the other side: {i.theirs}</span>{:else if i.state === "dropped"}<span class="text-dim">did not go ahead this time</span>{:else}<span class="text-dim">{i.state}</span>{/if}</td></tr>{/each}</tbody></table>
  </div>
  {/if}
  <div class="mt-6 flex items-baseline gap-3">
    <button class="btn" disabled={!!busy} onclick={forget}>{busy === "forget" ? "deleting…" : "✗ Delete everything about me"}</button>
    <p class="type text-[11px] text-dim">Removes the conversation, this card and any consents at once. Your key stays yours, on attest.</p>
  </div>
{/if}
