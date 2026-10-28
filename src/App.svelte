<script>
  import { route } from "./lib/router.svelte.js"; import { session, refresh } from "./lib/session.svelte.js"; import Menu from "./lib/Menu.svelte";
  import Talk from "./pages/Talk.svelte"; import Card from "./pages/Card.svelte"; import About from "./pages/About.svelte"; import Admin from "./pages/Admin.svelte";
  refresh();
  let v = $state(null); fetch("/version.json").then((r) => (r.ok ? r.json() : null)).then((j) => (v = j)).catch(() => {});
  const page = $derived(route.path === "/card" ? Card : route.path === "/about" ? About : route.path === "/admin" ? Admin : Talk);
</script>
<div class="fixed top-3 left-4 z-20 flex items-baseline gap-2"><a href="/" class="wordmark text-[22px] text-brand no-underline">Gertrude</a>{#if v?.sha}<span class="num text-[10px] text-dim" title={"built " + (v.at || "")}>{v.sha.slice(0, 7)}</span>{/if}</div>
<Menu />
<main class="mx-auto max-w-2xl px-4 pt-14 pb-8">
  {#key route.path}<svelte:component this={page} />{/key}
</main>
