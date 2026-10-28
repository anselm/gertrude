<script>
  import { route } from "./lib/router.svelte.js"; import { session, refresh } from "./lib/session.svelte.js"; import Menu from "./lib/Menu.svelte";
  import Talk from "./pages/Talk.svelte"; import Card from "./pages/Card.svelte"; import About from "./pages/About.svelte"; import Admin from "./pages/Admin.svelte";
  refresh();
  let v = $state(null); fetch("/version.json").then((r) => (r.ok ? r.json() : null)).then((j) => (v = j)).catch(() => {});
  const page = $derived(route.path === "/card" ? Card : route.path === "/about" ? About : route.path === "/admin" ? Admin : Talk); // "/" and "/i/<token>" are Talk
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }).toUpperCase();
</script>
<!-- the masthead: a Unigrid-style title band, then the four-stripe rule -->
<header class="band">
  <div class="mx-auto flex max-w-3xl items-baseline justify-between px-4 py-2">
    <a href="/" class="display text-[26px] no-underline" style="color: var(--color-paper)">Gertrude</a>
    <span class="type text-[10px] tracking-[0.12em] uppercase opacity-80">she connects people · {today}{#if v?.sha} · {v.sha.slice(0, 7)}{/if}</span>
  </div>
</header>
<div class="stripes"></div>
<Menu />
<main class="mx-auto max-w-3xl px-4 pt-4 pb-8">
  {#key route.path}<svelte:component this={page} />{/key}
</main>
