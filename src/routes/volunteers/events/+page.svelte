<script lang="ts">
  import { goto } from '$app/navigation';
  import { eventsState } from '$stores/events.svelte';
  import Button from '$components/ui/Button.svelte';
  import Modal from '$components/ui/Modal.svelte';

  const events = $derived(eventsState.events);

  function handleBack() {
    goto('/volunteers');
  }

  let createModalOpen = $state(false);
  let newName = $state('');
  let newCategory = $state('');
  let newLocation = $state('');
  let newStartsAt = $state('');
  let newCapacity = $state('');
  let newDescription = $state('');

  function resetCreateForm() {
    newName = '';
    newCategory = '';
    newLocation = '';
    newStartsAt = '';
    newCapacity = '';
    newDescription = '';
    createModalOpen = false;
  }

  function formatStartsAt(local: string): string {
    const [datePart, timePart] = local.split('T');
    if (!timePart) return datePart;
    const [h, m] = timePart.split(':').map(Number);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${datePart} ${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
  }

  function handleCreateEvent() {
    if (!newName.trim() || !newStartsAt) return;
    const capacity = newCapacity.trim() ? Number(newCapacity) : null;
    if (capacity !== null && (Number.isNaN(capacity) || capacity <= 0)) return;
    eventsState.addEvent({
      name: newName,
      category: newCategory,
      location: newLocation,
      startsAt: formatStartsAt(newStartsAt),
      description: newDescription,
      capacity
    });
    resetCreateForm();
  }
</script>

<svelte:head><title>Events Manager — MEssentials</title></svelte:head>

<div class="flex flex-col gap-6 p-4">
  <div class="flex items-center gap-3">
    <button onclick={handleBack} class="size-10 flex items-center justify-center rounded-m3-full bg-surface-variant text-on-surface-variant hover:bg-surface-container transition-colors">
      <span class="material-symbols-outlined">arrow_back</span>
    </button>
    <h1 class="text-2xl font-normal text-on-surface">Events Manager</h1>
    <div class="ml-auto flex items-center gap-2">
      <span class="material-symbols-outlined text-sm text-on-surface-variant">volunteer_activism</span>
      <span class="text-sm text-on-surface-variant">Events Manager</span>
    </div>
  </div>

  <div class="rounded-m3-xl bg-surface border border-outline-variant/30">
    <table class="w-full border-collapse">
      <thead>
        <tr class="border-b border-outline-variant/30">
          <th class="px-4 py-3 text-left text-sm font-medium text-on-surface">Event Name</th>
          <th class="px-4 py-3 text-left text-sm font-medium text-on-surface">Category</th>
          <th class="px-4 py-3 text-left text-sm font-medium text-on-surface">Starts At</th>
          <th class="px-4 py-3 text-right text-sm font-medium text-on-surface">Capacity</th>
        </tr>
      </thead>
      <tbody>
        {#each events as event}
          <tr class="border-b border-outline-variant/20 hover:bg-surface-container/30 transition-colors">
            <td class="px-4 py-3 text-sm text-on-surface">{event.name}</td>
            <td class="px-4 py-3 text-sm text-on-surface">{event.category}</td>
            <td class="px-4 py-3 text-sm text-on-surface">{event.startsAt}</td>
            <td class="px-4 py-3 text-sm text-on-surface text-right">{event.capacity ?? 'Unlimited'}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <div class="flex gap-3">
    <Button variant="tonal" onclick={() => { createModalOpen = true; }}>
      <span class="material-symbols-outlined text-sm">add</span>
      Create Event
    </Button>
    <Button variant="tonal" onclick={handleBack}>
      <span class="material-symbols-outlined text-sm">arrow_back</span>
      Back to My Roles
    </Button>
  </div>
</div>

<Modal isOpen={createModalOpen} title="Create Event">
  <form onsubmit={(e) => { e.preventDefault(); handleCreateEvent(); }} class="flex flex-col gap-4">
    <label class="flex flex-col gap-1.5">
      <span class="text-sm font-medium text-on-surface-variant">Event Name</span>
      <input type="text" bind:value={newName} required class="h-14 w-full rounded-m3-sm border border-outline bg-surface px-4 text-base text-on-surface" />
    </label>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <label class="flex flex-col gap-1.5">
        <span class="text-sm font-medium text-on-surface-variant">Category</span>
        <input type="text" bind:value={newCategory} class="h-14 w-full rounded-m3-sm border border-outline bg-surface px-4 text-base text-on-surface" />
      </label>
      <label class="flex flex-col gap-1.5">
        <span class="text-sm font-medium text-on-surface-variant">Location</span>
        <input type="text" bind:value={newLocation} class="h-14 w-full rounded-m3-sm border border-outline bg-surface px-4 text-base text-on-surface" />
      </label>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <label class="flex flex-col gap-1.5">
        <span class="text-sm font-medium text-on-surface-variant">Starts At</span>
        <input type="datetime-local" bind:value={newStartsAt} required class="h-14 w-full rounded-m3-sm border border-outline bg-surface px-4 text-base text-on-surface" />
      </label>
      <label class="flex flex-col gap-1.5">
        <span class="text-sm font-medium text-on-surface-variant">Capacity (blank = unlimited)</span>
        <input type="number" min="1" bind:value={newCapacity} class="h-14 w-full rounded-m3-sm border border-outline bg-surface px-4 text-base text-on-surface" />
      </label>
    </div>
    <label class="flex flex-col gap-1.5">
      <span class="text-sm font-medium text-on-surface-variant">Description</span>
      <textarea bind:value={newDescription} rows="3" class="w-full rounded-m3-sm border border-outline bg-surface px-4 py-3 text-base text-on-surface resize-y"></textarea>
    </label>
    <div class="flex justify-end gap-2">
      <Button variant="text" type="button" onclick={resetCreateForm}>Cancel</Button>
      <Button variant="primary" type="submit">Create Event</Button>
    </div>
  </form>
</Modal>