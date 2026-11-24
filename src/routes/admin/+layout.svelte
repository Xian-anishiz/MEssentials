<script lang="ts">
  import AdminNavRail from '$components/admin/AdminNavRail.svelte';
  import MobileNavDrawer from '$components/layout/MobileNavDrawer.svelte';
  import { page } from '$app/stores';

  type Props = { children?: import('svelte').Snippet };
  let { children }: Props = $props();

  let isMobileMenuOpen = $state(false);

  const isLoginRoute = $derived($page.url.pathname === '/admin/login');
</script>

{#if isLoginRoute}
  {@render children?.()}
{:else}
  <div class="flex h-dvh bg-background overflow-hidden overscroll-none">
    <AdminNavRail />
    <main class="flex-1 flex flex-col min-h-0 md:my-4 md:mx-4 md:rounded-m3-xl bg-surface overflow-hidden md:shadow-m3-1 md:border md:border-outline-variant/30">
      <header class="md:hidden flex items-center justify-between p-4 bg-surface border-b border-outline-variant shrink-0">
        <button
          aria-label="Open navigation menu"
          onclick={() => isMobileMenuOpen = true}
          class="size-10 flex items-center justify-center rounded-m3-full hover:bg-surface-variant transition-colors"
        >
          <span class="material-symbols-outlined">menu</span>
        </button>
        <span class="text-base font-medium text-on-surface">MEssentials Admin</span>
      </header>
      <div class="flex-1 flex flex-col min-w-0 min-h-0 overflow-y-auto overscroll-contain p-4">
        {@render children?.()}
      </div>
    </main>
  </div>

  <MobileNavDrawer isOpen={isMobileMenuOpen} onClose={() => isMobileMenuOpen = false} />
{/if}
