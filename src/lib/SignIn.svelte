<script>
  import { session, login } from "./session.svelte.js"; import { openPopup } from "./attest.js";
  let { why = "to talk to her" } = $props();
  async function go() { const popup = openPopup(); try { await login(popup); } catch {} }
</script>
<div class="pt-4">
  <h1>She connects people.</h1>
  <div class="hair mt-3"></div>
  <div class="body cols-2 mt-3">
    <p>Gertrude is a digital person: a program, run by Anselm Hook in Portland, Oregon, as a public service. She asks what you are up to and what you could use, keeps a card on you that you can read, correct and delete, and when two cards fit she asks both sides whether they would like to meet. Nothing is sent to anyone until both have said yes.</p>
    <p>She is mostly interested in what people are happy to have known. If you tell her something private she asks whether you would rather she forgot it, and if you say so she does not write it down. Her persona and all her code are open, and anyone may help make her wiser.</p>
    <p>You sign in with a passkey through <a class="text-brand" href="https://attest.monster" target="_blank" rel="noopener">attest</a> {why}. No password, no email; nothing is stored but a key.</p>
  </div>
  <div class="hair mt-3"></div>
  <div class="mt-3 flex items-baseline gap-4">
    <button class="btn primary" disabled={session.busy || !session.loaded} onclick={go}>{session.busy ? "signing in…" : "☞ Sign in"}</button>
    <a class="type text-[12px] text-dim" href="/?demo">or read a sample</a>
  </div>
  {#if session.progress}<p class="type mt-3 text-[13px] text-dim" role="status">{session.progress}</p>{/if}
</div>
