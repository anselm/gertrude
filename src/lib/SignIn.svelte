<script>
  import { session, login } from "./session.svelte.js"; import { openPopup } from "./attest.js";
  let { why = "to talk to her" } = $props();
  async function go() { const popup = openPopup(); try { await login(popup); } catch {} }
</script>
<div class="mx-auto max-w-md pt-6"><h1 class="display mb-4">She connects people.</h1>
  <p class="text-[15px] leading-relaxed">Gertrude is a digital person who connects people. She asks what you are up to, keeps a card you can read and delete, and when two people ought to meet she asks them both first.</p>
  <p class="mt-3 text-[15px] leading-relaxed text-dim">Sign in with a passkey through <a class="text-brand" href="https://attest.monster" target="_blank" rel="noopener">attest</a> {why}. No password, no email, nothing stored but a key.</p>
  <button class="btn primary mt-5" disabled={session.busy || !session.loaded} onclick={go}>{session.busy ? "signing in…" : "sign in"}</button>
  {#if session.progress}<p class="mt-3 text-sm text-dim" role="status">{session.progress}</p>{/if}
</div>
