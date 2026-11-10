<script lang="ts">
  import '../app.css';
  import AdminNavRail from '$components/admin/AdminNavRail.svelte';
  import MobileNavDrawer from '$components/layout/MobileNavDrawer.svelte';
  import NavRail from '$components/layout/NavRail.svelte'
  import { page } from '$app/stores';

  type Props = { children?: import('svelte').Snippet };
  let { children }: Props = $props();
  let isMobileMenuOpen = $state(false);

  const isAuthRoute = $derived($page.url.pathname === '/login' || $page.url.pathname === '/signup');
  const isAdminRoute = $derived($page.url.pathname.startsWith('/admin'));
  const isErrorRoute = $derived($page.error !== null);
</script>

<svelte:head>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" />
</svelte:head>

{#if isAuthRoute}
  {@render children?.()}
  
{:else if isAdminRoute}
  <div class="flex h-screen bg-background overflow-hidden">
    <AdminNavRail />
    <main class="flex-1 flex flex-col md:my-4 md:mx-4 md:rounded-m3-xl bg-surface overflow-hidden md:shadow-m3-1 md:border md:border-outline-variant/30">
      <div class="flex-1 flex flex-col min-w-0 overflow-y-auto p-4">
        {@render children?.()}
      </div>
    </main>
  </div>

{:else if isErrorRoute}
  <div class="flex flex-1 flex-row align-middle justify-center h-screen bg-background overflow-hidden">
    {@render children?.()}
  </div>

{:else}
  <div class="flex h-screen bg-background overflow-hidden">
    <NavRail />

    <main class="flex-1 flex flex-col md:my-4 md:mx-4 md:rounded-m3-xl bg-surface overflow-hidden md:shadow-m3-1 md:border md:border-outline-variant/30">
      <div class="md:hidden">
        <div class="flex items-center justify-between p-4 bg-surface border-b border-outline-variant">
          <button aria-label="Open navigation menu" class="size-10 flex items-center justify-center rounded-m3-full hover:bg-surface-variant transition-colors">
            <span class="material-symbols-outlined">menu</span>
          </button>
          <div class="flex items-center gap-2">
            <a href="/notifications" aria-label="Notifications" class="relative size-10 flex items-center justify-center rounded-m3-full hover:bg-surface-variant transition-colors">
              <span class="material-symbols-outlined">notifications</span>
            </a>
            <a href="/profile" aria-label="Profile" class="p-1 rounded-full">
              <div class="size-8 rounded-full bg-primary-container flex items-center justify-center text-primary">
                <span class="material-symbols-outlined text-sm">person</span>
              </div>
            </a>
          </div>
        </div>
      </div>

      <div class="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {@render children?.()}
      </div>
    </main>
  </div>
{/if}
