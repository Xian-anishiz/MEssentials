<script lang="ts">
  import { page } from '$app/state';
  
  let { isOpen = false, onClose }: { isOpen: boolean, onClose: () => void } = $props();

  const navItems = [
    { label: 'Store', href: '/store', icon: 'shopping_cart' },
    { label: 'Borrow', href: '/borrow', icon: 'library_books' },
    { label: 'Reviewer', href: '/reviewer', icon: 'book' },
    { label: 'Events', href: '/events', icon: 'calendar_today' },
    { label: 'Register', href: '/register', icon: 'badge' },
    { label: 'Notifications', href: '/notifications', icon: 'notifications' },
    { label: 'Profile', href: '/profile', icon: 'person' },
  ];
</script>

{#if isOpen}
  <div class="fixed inset-0 z-50 flex md:hidden" role="presentation">
    <button
      aria-label="Close menu"
      class="absolute inset-0 bg-black/40 cursor-default"
      onclick={onClose}
    ></button>
    <div class="relative w-[280px] bg-surface h-full flex flex-col p-6 shadow-m3-2 z-10" aria-label="Navigation menu">
      <div class="flex items-center justify-between pb-4 mb-4 border-b border-outline-variant">
        <h2 class="text-xl font-medium text-on-surface">MEssentials</h2>
        <button onclick={onClose} class="p-2">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <nav class="flex flex-col gap-2">
        {#each navItems as item}
          {@const isActive = page.url.pathname === item.href}
          <a 
            href={item.href} 
            onclick={onClose}
            class={`flex items-center gap-4 px-4 py-3 rounded-m3-full text-base font-medium transition-colors ${isActive ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface-variant hover:bg-surface-variant'}`}
          >
            <span class="material-symbols-outlined">{item.icon}</span>
            {item.label}
          </a>
        {/each}
      </nav>
    </div>
  </div>
{/if}