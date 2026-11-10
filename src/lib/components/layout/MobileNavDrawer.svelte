<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { authState } from '$stores/auth.svelte';
  import type { VolunteerRole } from '$mocks/volunteers';

  let { isOpen = false, onClose }: { isOpen: boolean, onClose: () => void } = $props();

  type NavItem = { label: string; href: string; icon: string };

  const studentNavItems: NavItem[] = [
    { label: 'Store', href: '/store', icon: 'shopping_cart' },
    { label: 'Borrow', href: '/borrow', icon: 'library_books' },
    { label: 'Reviewer', href: '/reviewer', icon: 'book' },
    { label: 'Events', href: '/events', icon: 'calendar_today' },
    { label: 'Register', href: '/register', icon: 'badge' },
    { label: 'Notifications', href: '/notifications', icon: 'notifications' },
    { label: 'Profile', href: '/profile', icon: 'person' },
  ];

  const sharedTailItems: NavItem[] = [
    { label: 'Notifications', href: '/notifications', icon: 'notifications' },
    { label: 'Profile', href: '/profile', icon: 'person' },
  ];

  const roleManagerPages: Record<VolunteerRole, NavItem> = {
    store_manager: { label: 'Store Manager', href: '/volunteers/store', icon: 'shopping_cart' },
    kailangan_manager: { label: 'Borrow Manager', href: '/volunteers/borrow', icon: 'library_books' },
    megaral_manager: { label: 'Reviewer Manager', href: '/volunteers/reviewers', icon: 'book' },
    medays_manager: { label: 'Events Manager', href: '/volunteers/events', icon: 'calendar_today' },
    registration_manager: { label: 'Queue Manager', href: '/volunteers/queue', icon: 'badge' }
  };

  const navItems = $derived<NavItem[]>(
    authState.user.role === 'volunteer'
      ? [
          { label: 'My Roles', href: '/volunteers', icon: 'volunteer_activism' },
          ...(((authState.user.volunteerRoles ?? []) as VolunteerRole[]).map(r => roleManagerPages[r])),
          ...sharedTailItems
        ]
      : studentNavItems
  );

  function isActive(item: NavItem): boolean {
    if (item.href === '/volunteers') return page.url.pathname === '/volunteers';
    return page.url.pathname.startsWith(item.href);
  }

  function handleLogout() {
    onClose();
    authState.logout();
    goto('/login');
  }
</script>

{#if isOpen}
  <div class="fixed inset-0 z-50 flex md:hidden" role="presentation">
    <button
      aria-label="Close menu"
      class="absolute inset-0 bg-black/40 cursor-default"
      onclick={onClose}
    ></button>
    <div class="relative w-[280px] bg-surface h-full flex flex-col p-6 shadow-m3-2 z-10 overflow-y-auto" aria-label="Navigation menu">
      <div class="flex items-center justify-between pb-4 mb-4 border-b border-outline-variant">
        <h2 class="text-xl font-medium text-on-surface">MEssentials</h2>
        <button onclick={onClose} class="p-2">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <nav class="flex flex-col gap-2">
        {#each navItems as item (item.href)}
          <a
            href={item.href}
            onclick={onClose}
            class={`flex items-center gap-4 px-4 py-3 rounded-m3-full text-base font-medium transition-colors ${isActive(item) ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface-variant hover:bg-surface-variant'}`}
          >
            <span class="material-symbols-outlined">{item.icon}</span>
            {item.label}
          </a>
        {/each}
      </nav>
      <div class="mt-auto pt-4 border-t border-outline-variant/30">
        <button
          type="button"
          onclick={handleLogout}
          class="w-full flex items-center gap-4 px-4 py-3 rounded-m3-full text-base font-medium text-error hover:bg-error/10 transition-colors"
        >
          <span class="material-symbols-outlined">logout</span>
          Log Out
        </button>
      </div>
    </div>
  </div>
{/if}