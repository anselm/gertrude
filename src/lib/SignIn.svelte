<script>
  import { session, login } from "./session.svelte.js"; import Install from "./Install.svelte";
  let { why = "to talk to her", via = null } = $props();
  // No popup anywhere (Anselm, 2026-10-27): attest's redirect flow signs in and returns here with the session in the fragment.
  async function go() { try { await login(null); } catch {} }
</script>
<div class="pt-4">
  {#if via}
    <p class="head mb-2">A word from Gertrude</p>
    <h1>{via.by} asked me to say hello.</h1>
    <div class="hair mt-3"></div>
    <div class="body mt-3">
      <p>I'm Gertrude. I should say straight away that I'm a digital person, a program, run by Anselm Hook in Portland as a public service. I introduce people: I ask what you're up to and what you could use, and when I know someone you ought to meet I ask you both first. {via.by} has vouched for you, so I'd like to hear what you're up to.</p>
    </div>
    <div class="hair mt-3"></div>
    <div class="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-2">
      <button class="btn primary" disabled={session.busy || !session.loaded} onclick={go}>{session.busy ? "one moment…" : "☞ Say hello"}</button>
      <span class="type text-[12px] text-dim">It takes your face or fingerprint, no password, no email.</span>
    </div>
    <p class="type mt-3 text-[12px] text-dim"><a class="text-brand" href="/about">What is this?</a> · <a class="text-brand" href="/?demo">read a sample</a></p>
  {:else}
    <h1>She connects people.</h1>
    <div class="hair mt-3"></div>
    <div class="body mt-3">
      <p>Gertrude is a digital person: a program, run by Anselm Hook in Portland, Oregon, as a public service. She asks what you are up to and what you could use, keeps a card on you that you can read, correct and delete, and when two cards fit she asks both sides whether they would like to meet. Nothing is sent to anyone until both have said yes.</p>
    </div>
    <div class="hair mt-3"></div>
    <div class="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-2">
      <button class="btn primary" disabled={session.busy || !session.loaded} onclick={go}>{session.busy ? "signing in…" : "☞ Sign in"}</button>
      <span class="type text-[12px] text-dim">Your face or fingerprint, through <a class="text-brand" href="https://attest.monster" target="_blank" rel="noopener">attest</a>. No password, no email.</span>
    </div>
    <p class="type mt-3 text-[12px] text-dim"><a class="text-brand" href="/about">What is this?</a> · <a class="text-brand" href="/?demo">read a sample</a></p>
  {/if}
  {#if session.progress}<p class="type mt-3 text-[13px] text-dim" role="status">{session.progress}</p>{/if}
  <Install />
</div>
