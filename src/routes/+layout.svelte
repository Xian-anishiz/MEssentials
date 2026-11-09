<script lang="ts">
  import '../app.css';
  import AppShell from '$components/layout/AppShell.svelte';
  import { page } from '$app/stores';

  type Props = { children?: import('svelte').Snippet };

  let { children }: Props = $props();

  const isAuthRoute = $derived($page.url.pathname === '/login' || $page.url.pathname === '/signup');
</script>

<svelte:head>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" />
</svelte:head>

{#if isAuthRoute}
  {@render children?.()}
{:else}
  <AppShell>
    {@render children?.()}
  </AppShell>
{/if}
