<script lang="ts">
  import { notificationsState } from '$stores/notifications.svelte';

  let { onOpenMenu }: { onOpenMenu: () => void } = $props();

  const unreadCount = $derived(notificationsState.unreadCount);
</script>

<header class="md:hidden flex items-center justify-between p-4 bg-surface border-b border-outline-variant shrink-0">
  <button aria-label="Open navigation menu" onclick={onOpenMenu} class="size-10 flex items-center justify-center rounded-m3-full hover:bg-surface-variant transition-colors">
    <span class="material-symbols-outlined">menu</span>
  </button>
  <div class="flex items-center gap-1">
    <a href="/notifications" aria-label="Notifications" class="relative size-10 flex items-center justify-center rounded-m3-full hover:bg-surface-variant transition-colors">
      <span class="material-symbols-outlined">notifications</span>
      {#if unreadCount > 0}
        <span class="absolute top-1.5 right-1.5 size-2 rounded-full bg-error"></span>
      {/if}
    </a>
    <a href="/profile" aria-label="Profile" class="p-1 rounded-full">
      <div class="size-8 rounded-full bg-primary-container flex items-center justify-center text-primary">
        <span class="material-symbols-outlined text-sm">person</span>
      </div>
    </a>
  </div>
</header>