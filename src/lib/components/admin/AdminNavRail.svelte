<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { authState } from '$stores/auth.svelte';

  const currentPath = $derived($page.url.pathname);

  const navItems = [
    { label: 'Dashboard', href: '/admin', icon: 'dashboard' },
    { label: 'Usage Logs', href: '/admin/usage-logs', icon: 'history' },
    { label: 'Students', href: '/admin/students', icon: 'people' },
    { label: 'Volunteers', href: '/admin/volunteers', icon: 'volunteer_activism' },
    { label: 'Admins', href: '/admin/admins', icon: 'admin_panel_settings' },
  ] as const;

  function handleLogout() {
    authState.logout();
    goto('/login');
  }
</script>

<aside class="hidden md:flex w-rail shrink-0 flex-col items-center justify-between py-6 bg-background border-r border-outline-variant/30 select-none">
  <!-- Top: Admin Navigation Rail -->
  <nav class="flex flex-col items-center gap-4">
    {#each navItems as item}
      {@const isActive = item.href === '/admin' ? currentPath === '/admin' : currentPath.startsWith(item.href)}
      <a
        href={item.href}
        class="flex flex-col items-center gap-1 group"
        title={item.label}
      >
        <span class={`h-8 w-14 flex items-center justify-center rounded-m3-full transition-colors ${isActive ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface-variant hover:bg-primary/10'}`}>
          <span class="material-symbols-outlined text-[24px]">{item.icon}</span>
        </span>
        <span class="text-[11px] font-medium tracking-[0.5px] text-on-surface">{item.label}</span>
      </a>
    {/each}
  </nav>

  <!-- Bottom: Logout -->
  <div class="flex flex-col items-center gap-4">
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