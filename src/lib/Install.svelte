<script>
  import { install, ask } from "./install.svelte.js";
  let { compact = false } = $props(); let hidden = $state(false);
  try { hidden = sessionStorage.getItem("gt_install_hidden") === "1"; } catch {}
  const hide = () => { hidden = true; try { sessionStorage.setItem("gt_install_hidden", "1"); } catch {} };
</script>
{#if !install.standalone && !install.done && !hidden && (install.prompt || install.ios)}
  <div class="card mt-3 !pb-3" style="border-top-color: var(--color-gold)">
    <div class="flex items-baseline justify-between pt-1"><span class="head">Put her on your phone</span><button class="chip" onclick={hide}>later</button></div>
    <p class="body mt-1">Gertrude can only reach you with a suggestion if she lives on your home screen. It takes a moment and nothing is installed from a store.</p>
    {#if install.prompt}<button class="btn primary mt-2" onclick={ask}>☞ Install Gertrude</button>
    {:else if install.ios}<p class="type mt-2 text-[12px]">On iPhone: tap the <b>Share</b> button, then <b>Add to Home Screen</b>, then open her from there.</p>{/if}
  </div>
{/if}
