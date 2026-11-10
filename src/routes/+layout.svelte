<script lang="ts">
  import '../app.css';
  import AdminNavRail from '$components/admin/AdminNavRail.svelte';
  import MobileNavDrawer from '$components/layout/MobileNavDrawer.svelte';
  import { page } from '$app/stores';

  type Props = { children?: import('svelte').Snippet };
  let { children }: Props = $props();
  let isMobileMenuOpen = $state(false);

  const isAuthRoute = $derived($page.url.pathname === '/login' || $page.url.pathname === '/signup');
  const isAdminRoute = $derived($page.url.pathname.startsWith('/admin'));
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
{:else}
  <div class="flex h-screen bg-background overflow-hidden">
    <aside class="hidden md:flex w-rail shrink-0 flex-col items-center justify-between py-6 bg-background border-r border-outline-variant/30 select-none">
      <nav class="flex flex-col items-center gap-4">
        <a href="/store" class="flex flex-col items-center gap-1 group" title="Store">
          <span class="h-8 w-14 flex items-center justify-center rounded-m3-full text-on-surface-variant hover:bg-primary/10">
            <span class="material-symbols-outlined text-[24px]">shopping_cart</span>
          </span>
          <span class="text-[11px] font-medium tracking-[0.5px] text-on-surface">Store</span>
        </a>
        <a href="/events" class="flex flex-col items-center gap-1 group" title="Events">
          <span class="h-8 w-14 flex items-center justify-center rounded-m3-full text-on-surface-variant hover:bg-primary/10">
            <span class="material-symbols-outlined text-[24px]">calendar_today</span>
          </span>
          <span class="text-[11px] font-medium tracking-[0.5px] text-on-surface">Events</span>
        </a>
        <a href="/borrow" class="flex flex-col items-center gap-1 group" title="Borrow">
          <span class="h-8 w-14 flex items-center justify-center rounded-m3-full text-on-surface-variant hover:bg-primary/10">
            <span class="material-symbols-outlined text-[24px]">library_books</span>
          </span>
          <span class="text-[11px] font-medium tracking-[0.5px] text-on-surface">Borrow</span>
        </a>
        <a href="/reviewer" class="flex flex-col items-center gap-1 group" title="Reviewer">
          <span class="h-8 w-14 flex items-center justify-center rounded-m3-full text-on-surface-variant hover:bg-primary/10">
            <span class="material-symbols-outlined text-[24px]">book</span>
          </span>
          <span class="text-[11px] font-medium tracking-[0.5px] text-on-surface">Reviewer</span>
        </a>
        <a href="/register" class="flex flex-col items-center gap-1 group" title="Register">
          <span class="h-8 w-14 flex items-center justify-center rounded-m3-full text-on-surface-variant hover:bg-primary/10">
            <span class="material-symbols-outlined text-[24px]">badge</span>
          </span>
          <span class="text-[11px] font-medium tracking-[0.5px] text-on-surface">Register</span>
        </a>
      </nav>

      <div class="flex flex-col items-center gap-4">
        <a href="/notifications" class="relative flex flex-col items-center gap-1 group" title="Notifications">
          <span class="h-8 w-14 flex items-center justify-center rounded-m3-full text-on-surface-variant hover:bg-primary/10">
            <span class="material-symbols-outlined text-[24px]">notifications</span>
          </span>
          <span class="text-[11px] font-medium tracking-[0.5px] text-on-surface">Alerts</span>
        </a>
        <a href="/profile" class="flex flex-col items-center gap-1 group" title="Profile">
          <span class="size-10 flex items-center justify-center rounded-m3-full bg-primary-container text-on-primary-container">
            <span class="material-symbols-outlined text-[20px]">person</span>
          </span>
          <span class="text-[11px] font-medium tracking-[0.5px] text-on-surface">Profile</span>
        </a>
      </div>
    </aside>

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
