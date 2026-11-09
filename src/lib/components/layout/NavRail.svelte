<script lang="ts">
  import { page } from '$app/stores';
  import { notificationsState } from '$stores/notifications.svelte';
  import { authState } from '$stores/auth.svelte';

  const unreadCount = $derived(notificationsState.unreadCount);
  const currentPath = $derived($page.url.pathname);
</script>

<aside class="hidden md:flex w-rail shrink-0 flex-col items-center justify-between py-6 bg-background border-r border-outline-variant/30 select-none">
  <!-- Top: Service Navigation Rail -->
  <nav class="flex flex-col items-center gap-4">
    <!-- Store -->
    <a href="/store" class="flex flex-col items-center gap-1 group" title="Store">
      <span class={`h-8 w-14 flex items-center justify-center rounded-m3-full transition-colors ${currentPath.startsWith('/store') ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface-variant hover:bg-primary/10'}`}>
        <span class="material-symbols-outlined text-[24px]">shopping_cart</span>
      </span>
      <span class="text-[11px] font-medium tracking-[0.5px] text-on-surface">Store</span>
    </a>

    <!-- Events -->
    <a href="/events" class="flex flex-col items-center gap-1 group" title="Events">
      <span class={`h-8 w-14 flex items-center justify-center rounded-m3-full transition-colors ${currentPath.startsWith('/events') ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface-variant hover:bg-primary/10'}`}>
        <span class="material-symbols-outlined text-[24px]">calendar_today</span>
      </span>
      <span class="text-[11px] font-medium tracking-[0.5px] text-on-surface">Events</span>
    </a>

    <!-- Borrow -->
    <a href="/borrow" class="flex flex-col items-center gap-1 group" title="Borrow">
      <span class={`h-8 w-14 flex items-center justify-center rounded-m3-full transition-colors ${currentPath.startsWith('/borrow') ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface-variant hover:bg-primary/10'}`}>
        <span class="material-symbols-outlined text-[24px]">library_books</span>
      </span>
      <span class="text-[11px] font-medium tracking-[0.5px] text-on-surface">Borrow</span>
    </a>

    <!-- Reviewer -->
    <a href="/reviewer" class="flex flex-col items-center gap-1 group" title="Reviewer">
      <span class={`h-8 w-14 flex items-center justify-center rounded-m3-full transition-colors ${currentPath.startsWith('/reviewer') ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface-variant hover:bg-primary/10'}`}>
        <span class="material-symbols-outlined text-[24px]">book</span>
      </span>
      <span class="text-[11px] font-medium tracking-[0.5px] text-on-surface">Reviewer</span>
    </a>

    <!-- Register -->
    <a href="/register" class="flex flex-col items-center gap-1 group" title="Register">
      <span class={`h-8 w-14 flex items-center justify-center rounded-m3-full transition-colors ${currentPath.startsWith('/register') ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface-variant hover:bg-primary/10'}`}>
        <span class="material-symbols-outlined text-[24px]">badge</span>
      </span>
      <span class="text-[11px] font-medium tracking-[0.5px] text-on-surface">Register</span>
    </a>
  </nav>

  <!-- Bottom: Notifications & Profile -->
  <div class="flex flex-col items-center gap-4">
    <!-- Notifications -->
    <a href="/notifications" class="relative flex flex-col items-center gap-1 group" title="Notifications">
      <span class={`h-8 w-14 flex items-center justify-center rounded-m3-full transition-colors ${currentPath.startsWith('/notifications') ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface-variant hover:bg-primary/10'}`}>
        <span class="material-symbols-outlined text-[24px]">notifications</span>
      </span>
      {#if unreadCount > 0}
        <span class="absolute top-0 right-2 size-2.5 rounded-full bg-error ring-2 ring-background"></span>
      {/if}
      <span class="text-[11px] font-medium tracking-[0.5px] text-on-surface">Alerts</span>
    </a>

    <!-- Profile -->
    <a href="/profile" class="flex flex-col items-center gap-1 group" title="Profile">
      <span class={`size-10 flex items-center justify-center rounded-m3-full transition-colors ${currentPath.startsWith('/profile') ? 'bg-primary text-on-primary' : 'bg-primary-container text-on-primary-container hover:brightness-95'}`}>
        <span class="material-symbols-outlined text-[20px]">person</span>
      </span>
      <span class="text-[11px] font-medium tracking-[0.5px] text-on-surface">Profile</span>
    </a>
  </div>
</aside>
