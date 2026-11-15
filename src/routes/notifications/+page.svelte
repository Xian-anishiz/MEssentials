<script lang="ts">
  import Button from '$components/ui/Button.svelte';
  import { notificationsState } from '$stores/notifications.svelte';
  import { authState } from '$stores/auth.svelte';

  const user = $derived(authState.user);
</script>

<svelte:head>
  <title>Notifications — MEssentials</title>
</svelte:head>

<div class="flex flex-1 min-h-full flex-col p-4 md:p-6 overflow-y-auto gap-6 max-w-4xl mx-auto w-full">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-normal text-on-surface">Notifications</h1>
      <p class="text-sm text-on-surface-variant">System alerts, updates, and service reminders.</p>
    </div>
    {#if notificationsState.unreadCount > 0}
      <Button variant="outlined" size="sm" onclick={() => notificationsState.markAllAsRead()}>Mark all as read</Button>
    {/if}
  </div>

  <!-- Web Push / iOS Onboarding Banner -->
  <div class="rounded-m3-lg bg-primary-container p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-on-primary-container">
    <div class="flex items-center gap-3">
      <span class="material-symbols-outlined text-[32px] text-primary">notifications_active</span>
      <div>
        <h3 class="text-base font-medium">Web Push Alerts</h3>
        <p class="text-xs text-on-primary-container/80 mt-0.5">Enable notifications to receive due reminders and queue alerts instantly.</p>
      </div>
    </div>
    <Button variant="primary" size="sm" onclick={() => authState.togglePush(!user.pushEnabled)}>
      {user.pushEnabled ? 'Turn Off Alerts' : 'Turn On Alerts'}
    </Button>
  </div>

  <!-- Notification List -->
  <ul class="flex flex-col gap-3">
    {#each notificationsState.notifications as n (n.id)}
      <li class={`flex items-center gap-4 px-5 py-4 rounded-m3-lg border transition-colors ${n.read ? 'bg-surface border-outline-variant/30 text-on-surface-variant' : 'bg-surface-variant/40 border-primary/40 font-medium text-on-surface'}`}>
        <div class="size-12 rounded-m3-lg bg-surface flex items-center justify-center text-primary shrink-0">
          <span class="material-symbols-outlined text-[24px]">
            {#if n.service === 'kailangan'}inventory_2
            {:else if n.service === 'medays'}event
            {:else if n.service === 'megaral'}book
            {:else if n.service === 'store'}shopping_cart
            {:else}notifications
            {/if}
          </span>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="text-sm font-semibold">{n.subject}</span>
            <span class="text-xs text-on-surface-variant">• {n.createdAt}</span>
            {#if !n.read}
              <span class="size-2 rounded-full bg-primary"></span>
            {/if}
          </div>
          <p class="text-xs text-on-surface-variant mt-1">{n.body}</p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          {#if !n.read}
            <Button variant="text" size="sm" onclick={() => notificationsState.markAsRead(n.id)}>Mark read</Button>
          {/if}
          <button onclick={() => notificationsState.deleteNotification(n.id)} aria-label="Delete" class="size-8 rounded-m3-full flex items-center justify-center hover:bg-surface-variant text-on-surface-variant">
            <span class="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      </li>
    {/each}
  </ul>

  {#if notificationsState.notifications.length === 0}
    <div class="flex flex-col items-center justify-center py-16 text-center">
      <span class="material-symbols-outlined text-[48px] text-outline-variant">notifications_off</span>
      <p class="text-base font-medium text-on-surface mt-2">No notifications</p>
    </div>
  {/if}
</div>
