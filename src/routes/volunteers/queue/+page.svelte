<script lang="ts">
  import { goto } from '$app/navigation';
  import { queueState } from '$stores/queue.svelte';
  import Button from '$components/ui/Button.svelte';

  const queue = $derived(queueState.queue);

  function handleBack() {
    goto('/volunteers');
  }
</script>

<svelte:head><title>Queue Manager — MEssentials</title></svelte:head>

<div class="flex flex-col gap-6 p-4">
  <div class="flex items-center gap-3">
    <button onclick={handleBack} class="size-10 flex items-center justify-center rounded-m3-full bg-surface-variant text-on-surface-variant hover:bg-surface-container transition-colors">
      <span class="material-symbols-outlined">arrow_back</span>
    </button>
    <h1 class="text-2xl font-normal text-on-surface">Queue Manager</h1>
    <div class="ml-auto flex items-center gap-2">
      <span class="material-symbols-outlined text-sm text-on-surface-variant">volunteer_activism</span>
      <span class="text-sm text-on-surface-variant">Queue Manager</span>
    </div>
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    <div class="p-4 bg-surface-container/50 rounded-m3-xl border border-outline-variant/30">
      <p class="text-sm text-on-surface-variant">Session</p>
      <p class="text-lg font-medium text-on-surface">{queue.sessionName}</p>
    </div>
    <div class="p-4 bg-surface-container/50 rounded-m3-xl border border-outline-variant/30">
      <p class="text-sm text-on-surface-variant">Status</p>
      <p class="text-lg font-medium text-on-surface">
        <span class="inline-flex items-center gap-1.5">
          <span class={`size-2 rounded-full ${queue.sessionOpen ? 'bg-success' : 'bg-error'}`}></span>
          {queue.sessionOpen ? 'Open' : 'Closed'}
        </span>
      </p>
    </div>
    <div class="p-4 bg-surface-container/50 rounded-m3-xl border border-outline-variant/30">
      <p class="text-sm text-on-surface-variant">Queue Length</p>
      <p class="text-lg font-medium text-on-surface">{queue.queueLength}</p>
    </div>
    <div class="p-4 bg-surface-container/50 rounded-m3-xl border border-outline-variant/30">
      <p class="text-sm text-on-surface-variant">Current Adviser</p>
      <p class="text-lg font-medium text-on-surface">{queue.adviserName ?? '—'}</p>
    </div>
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <div class="p-6 bg-primary-container/30 rounded-m3-xl border border-outline-variant/30 text-center">
      <p class="text-sm text-on-surface-variant">Now Serving</p>
      <p class="text-4xl font-medium text-primary mt-2">{queue.nowServing ?? '—'}</p>
      <p class="text-xs text-on-surface-variant mt-2">Advance with "Call Next Student"</p>
    </div>
    <div class="p-6 bg-surface-container/50 rounded-m3-xl border border-outline-variant/30 text-center">
      <p class="text-sm text-on-surface-variant">Next Number in Queue</p>
      <p class="text-4xl font-medium text-on-surface mt-2">{queue.nowServing !== null ? queue.nowServing + 1 : '—'}</p>
      <p class="text-xs text-on-surface-variant mt-2">{queue.queueLength} students waiting</p>
    </div>
  </div>

  <div class="rounded-m3-xl bg-surface border border-outline-variant/30 p-4">
    <h3 class="text-sm font-medium text-on-surface-variant mb-4">Adviser Management</h3>
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <label class="flex flex-col gap-1.5">
        <span class="text-sm font-medium text-on-surface-variant">Adviser Name</span>
        <input
          type="text"
          value={queue.adviserName ?? ''}
          oninput={(e) => queueState.updateQueueFields({ adviserName: e.currentTarget.value || null })}
          class="h-14 w-full rounded-m3-sm border border-outline bg-surface px-4 text-base text-on-surface"
        />
      </label>
      <label class="flex flex-col gap-1.5">
        <span class="text-sm font-medium text-on-surface-variant">Desk</span>
        <input
          type="text"
          value={queue.adviserDesk ?? ''}
          oninput={(e) => queueState.updateQueueFields({ adviserDesk: e.currentTarget.value || null })}
          class="h-14 w-full rounded-m3-sm border border-outline bg-surface px-4 text-base text-on-surface"
        />
      </label>
      <label class="flex flex-col gap-1.5">
        <span class="text-sm font-medium text-on-surface-variant">Location</span>
        <input
          type="text"
          value={queue.location ?? ''}
          oninput={(e) => queueState.updateQueueFields({ location: e.currentTarget.value || null })}
          class="h-14 w-full rounded-m3-sm border border-outline bg-surface px-4 text-base text-on-surface"
        />
      </label>
    </div>
  </div>

  <div class="flex gap-3">
    <Button variant="tonal" onclick={() => queueState.setSessionOpen(!queue.sessionOpen)}>
      <span class="material-symbols-outlined text-sm">{queue.sessionOpen ? 'pause_circle' : 'play_circle'}</span>
      {queue.sessionOpen ? 'Close Queue' : 'Open Queue'}
    </Button>
    <Button variant="primary" disabled={!queue.sessionOpen} onclick={() => queueState.advanceQueue()}>
      <span class="material-symbols-outlined text-sm">call</span>
      Call Next Student
    </Button>
  </div>
</div>