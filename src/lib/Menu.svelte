<script>
  import { session, logout } from "./session.svelte.js";
  let open = $state(false); const close = () => (open = false);
</script>
<div class="fixed bottom-4 right-3 z-30 md:top-14 md:bottom-auto">
  <button aria-label="menu" class="btn h-9 w-9 !p-0 text-base leading-9 text-center" onclick={() => (open = !open)}>≡</button>
  {#if open}
    <div class="absolute right-0 bottom-11 md:bottom-auto md:top-11 w-60 border border-rule bg-card p-1 type text-[13px] shadow-[4px_4px_0_var(--color-rule)]" onclick={close} onkeydown={close} role="menu" tabindex="-1">
      <a class="block px-3 py-1.5 no-underline hover:text-brand" href="/">1. Talk to Gertrude</a>
      <a class="block px-3 py-1.5 no-underline hover:text-brand" href="/card">2. Your card on file</a>
      <a class="block px-3 py-1.5 no-underline hover:text-brand" href="/about">3. About · how this works</a>
      {#if !session.loaded}<p class="px-3 py-1.5 text-dim">checking sign-in…</p>
      {:else if session.user}
        {#if session.user.admin}<a class="block px-3 py-1.5 no-underline hover:text-brand" href="/admin">4. Admin</a>{/if}
        <a class="block px-3 py-1.5 no-underline hover:text-brand" href={session.attest + "/me"} target="_blank" rel="noopener">Your keys on attest ↗</a>
        <div class="hair my-1"></div>
        <button class="block w-full px-3 py-1.5 text-left hover:text-brand" onclick={async () => { try { await logout(); } finally { location.assign("/"); } }}>Sign out</button>
      {:else}<div class="hair my-1"></div><a class="block px-3 py-1.5 no-underline hover:text-brand" href="/">Sign in</a>{/if}
    </div>
  {/if}
</div>
