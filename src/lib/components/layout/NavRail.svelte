<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { notificationsState } from '$stores/notifications.svelte';
  import { authState } from '$stores/auth.svelte';
  import type { VolunteerRole } from '$mocks/volunteers';

  const unreadCount = $derived(notificationsState.unreadCount);
  const currentPath = $derived($page.url.pathname);

  type NavItem = { label: string; href: string; icon: string };

  const studentNavItems: NavItem[] = [
    { label: 'Store', href: '/store', icon: 'shopping_cart' },
    { label: 'Events', href: '/events', icon: 'calendar_today' },
    { label: 'Borrow', href: '/borrow', icon: 'library_books' },
    { label: 'Reviewer', href: '/reviewer', icon: 'book' },
    { label: 'Register', href: '/register', icon: 'badge' }
  ];

  const roleManagerPages: Record<VolunteerRole, NavItem> = {
    store_manager: { label: 'Store Mgr', href: '/volunteers/store', icon: 'shopping_cart' },
    kailangan_manager: { label: 'Borrow Mgr', href: '/volunteers/borrow', icon: 'library_books' },
    megaral_manager: { label: 'Reviewer Mgr', href: '/volunteers/reviewers', icon: 'book' },
    medays_manager: { label: 'Events Mgr', href: '/volunteers/events', icon: 'calendar_today' },
    registration_manager: { label: 'Queue Mgr', href: '/volunteers/queue', icon: 'badge' }
  };

  const navItems = $derived<NavItem[]>(
    authState.user.role === 'volunteer'
      ? [
          { label: 'My Roles', href: '/volunteers', icon: 'volunteer_activism' },
          ...(((authState.user.volunteerRoles ?? []) as VolunteerRole[]).map(r => roleManagerPages[r]))
        ]
      : studentNavItems
  );

  function isActive(item: NavItem): boolean {
    if (item.href === '/volunteers') return currentPath === '/volunteers';
    return currentPath.startsWith(item.href);
  }

  function handleLogout() {
    authState.logout();
    goto('/login');
  }
</script>

<aside class="hidden md:flex w-rail shrink-0 flex-col items-center justify-between py-6 bg-background border-r border-outline-variant/30 select-none">
  <!-- Top: Service Navigation Rail -->
  <nav class="flex flex-col items-center gap-4">
    {#each navItems as item (item.href)}
      <a href={item.href} class="flex flex-col items-center gap-1 group" title={item.label}>
        <span class={`h-8 w-14 flex items-center justify-center rounded-m3-full transition-colors ${isActive(item) ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface-variant hover:bg-primary/10'}`}>
          <span class="material-symbols-outlined text-[24px]">{item.icon}</span>
        </span>
        <span class="text-[11px] font-medium tracking-[0.5px] text-on-surface">{item.label}</span>
      </a>
    {/each}
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

    <!-- Logout -->
    <button
      type="button"
      onclick={handleLogout}
      class="mt-2 flex flex-col items-center gap-1 group text-on-surface-variant hover:text-error"
      title="Log Out"
    >
      <span class="size-10 flex items-center justify-center rounded-m3-full border border-outline-variant/40 transition-colors text-on-surface-variant group-hover:bg-error/10 group-hover:text-error">
        <span class="material-symbols-outlined text-[20px]">logout</span>
      </span>
      <span class="text-[11px] font-medium tracking-[0.5px]">Log Out</span>
    </button>
  </div>
</aside>
