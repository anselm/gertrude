<script>
  import { session, logout } from "./session.svelte.js";
  let open = $state(false); const close = () => (open = false);
</script>
<div class="fixed top-2 right-3 z-30">
  <button aria-label="menu" class="h-8 w-8 rounded-[4px] bg-panel text-ink text-lg leading-8 text-center" onclick={() => (open = !open)}>≡</button>
  {#if open}
    <div class="absolute right-0 mt-1 w-52 rounded-[4px] bg-panel p-1 text-sm shadow-lg" onclick={close} onkeydown={close} role="menu" tabindex="-1">
      <a class="block px-3 py-1.5 no-underline hover:text-brand" href="/">talk to Gertrude</a>
      <a class="block px-3 py-1.5 no-underline hover:text-brand" href="/card">your card · what she holds</a>
      <a class="block px-3 py-1.5 no-underline hover:text-brand" href="/about">about · how this works</a>
      {#if !session.loaded}<p class="px-3 py-1.5 text-dim">checking sign-in…</p>
      {:else if session.user}
        {#if session.user.admin}<a class="block px-3 py-1.5 no-underline hover:text-brand" href="/admin">admin</a>{/if}
        <a class="block px-3 py-1.5 no-underline hover:text-brand" href={session.attest + "/me"} target="_blank" rel="noopener">your keys on attest ↗</a>
        <button class="block w-full px-3 py-1.5 text-left hover:text-brand" onclick={async () => { try { await logout(); } finally { location.assign("/"); } }}>sign out</button>
      {:else}<a class="block px-3 py-1.5 no-underline hover:text-brand" href="/">sign in</a>{/if}
    </div>
  {/if}
</div>
