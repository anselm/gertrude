<script>
  import { install, ask, iosNotSafari } from "./install.svelte.js";
  let { compact = false } = $props(); let hidden = $state(false);
  try { hidden = sessionStorage.getItem("gt_install_hidden") === "1"; } catch {}
  const hide = () => { hidden = true; try { sessionStorage.setItem("gt_install_hidden", "1"); } catch {} };
</script>
{#if !install.standalone && !install.done && !hidden && (install.prompt || install.ios)}
  <div class="card plain mt-3 !pb-3" style="border-top-color: var(--color-gold)">
    <div class="flex items-baseline justify-between pt-1"><span class="head">Put her on your phone</span><button class="chip" onclick={hide}>later</button></div>
    <p class="body mt-1">Gertrude can only reach you with a suggestion if she lives on your home screen. It takes a moment and nothing is installed from a store.</p>
    {#if install.prompt}<button class="btn primary mt-2" onclick={ask}>☞ Install Gertrude</button>
    {:else if iosNotSafari()}<p class="type mt-2 text-[12px]">On an iPhone this has to be done in <b>Safari</b>. Open <b>gertrude.exe.xyz</b> there, then follow the steps below.</p>{/if}
    {#if install.ios}<ol class="type mt-2 list-decimal pl-5 text-[12px] leading-5">
      <li>In Safari, tap <b>Share</b> <svg class="inline -mt-1 align-middle" width="14" height="16" viewBox="0 0 14 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10V1.5M4 4.5 7 1.5l3 3"/><path d="M3 7H1.5v8h11V7H11"/></svg>, the square with the arrow, at the bottom of the screen.</li>
      <li>Scroll the sheet and tap <b>Add to Home Screen</b>, then <b>Add</b>.</li>
      <li>Open <b>Gertrude</b> from the new icon. Notifications only work from there, not from a browser tab.</li>
    </ol>{/if}
  </div>
{/if}
