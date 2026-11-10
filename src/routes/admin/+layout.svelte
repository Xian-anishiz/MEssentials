<script lang="ts">
  import AdminNavRail from '$components/admin/AdminNavRail.svelte';
  import { page } from '$app/stores';

  type Props = { children?: import('svelte').Snippet };
  let { children }: Props = $props();

  const isLoginRoute = $derived($page.url.pathname === '/admin/login');
</script>

{#if isLoginRoute}
  {@render children?.()}
{:else}
  <div class="flex h-screen bg-background overflow-hidden">
    <AdminNavRail />
    <main class="flex-1 flex flex-col md:my-4 md:mx-4 md:rounded-m3-xl bg-surface overflow-hidden md:shadow-m3-1 md:border md:border-outline-variant/30">
      <div class="flex-1 flex flex-col min-w-0 overflow-y-auto p-4">
        {@render children?.()}
      </div>
    </main>
  </div>
{/if}
