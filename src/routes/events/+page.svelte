<script lang="ts">
  import FilterPanel from '$components/layout/FilterPanel.svelte';
  import FilterDrawer from '$components/layout/FilterDrawer.svelte';
  import SearchInput from '$components/ui/SearchInput.svelte';
  import Checkbox from '$components/ui/Checkbox.svelte';
  import Button from '$components/ui/Button.svelte';
  import EventDetailModal from '$components/domain/events/EventDetailModal.svelte';
  import { eventsState } from '$stores/events.svelte';
  import type { EventItem } from '$mocks/events';

  let searchQuery = $state('');
  let selectedCategories = $state<Record<string, boolean>>({
    recreational: true, academic: true, career: true
  });

  let isFilterDrawerOpen = $state(false);
  let selectedEvent = $state<EventItem | null>(null);
  let isEventModalOpen = $state(false);

  const categories = ['recreational', 'academic', 'career'];

  const filteredRegistered = $derived.by(() => {
    return eventsState.registeredEvents.filter(e => {
      if (searchQuery && !e.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (!selectedCategories[e.category]) return false;
      return true;
    });
  });

  const filteredAvailable = $derived.by(() => {
    return eventsState.availableEvents.filter(e => {
      if (searchQuery && !e.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (!selectedCategories[e.category]) return false;
      return true;
    });
  });

  function resetFilters() {
    searchQuery = '';
    categories.forEach(c => selectedCategories[c] = true);
  }
</script>

<svelte:head>
  <title>ME Days Events — MEssentials</title>
</svelte:head>

<div class="flex flex-1 min-h-full">
  <div class="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto gap-6">
    <div class="flex md:hidden items-center justify-between">
      <h1 class="text-2xl font-normal text-on-surface">ME Days</h1>
      <button onclick={() => isFilterDrawerOpen = true} class="h-9 px-3 rounded-m3-sm bg-primary-container text-on-primary-container text-sm font-medium flex items-center gap-1">
        <span class="material-symbols-outlined text-[18px]">filter_list</span>
        Filters
      </button>
    </div>

    <!-- Registered Events -->
    <div class="flex flex-col gap-3">
      <h2 class="text-xl font-medium text-on-surface">Registered Events</h2>
      {#if filteredRegistered.length > 0}
        <ul class="flex flex-col gap-2">
          {#each filteredRegistered as event (event.id)}
            <li class="flex items-center gap-4 px-4 py-3 rounded-m3-lg bg-primary-container/30 border border-primary/30">
              <div class="flex-1 min-w-0">
                <p class="text-base font-medium text-on-surface truncate">{event.name}</p>
                <p class="text-xs text-on-surface-variant">{event.description}</p>
              </div>
              <div class="flex items-center gap-2">
                <Button variant="secondary" size="sm" onclick={() => { selectedEvent = event; isEventModalOpen = true; }}>See More</Button>
                <Button variant="error" size="sm" onclick={() => eventsState.unregisterEvent(event.id)}>Unregister</Button>
              </div>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="text-sm text-on-surface-variant italic">You have not registered for any events yet.</p>
      {/if}
    </div>

    <!-- Available Events -->
    <div class="flex flex-col gap-3 pt-4 border-t border-outline-variant/40">
      <h2 class="text-xl font-medium text-on-surface">Available Events</h2>
      <ul class="flex flex-col gap-3">
        {#each filteredAvailable as event (event.id)}
          <li class="flex items-center gap-4 px-4 py-4 rounded-m3-lg bg-surface border border-outline-variant/40 hover:border-primary transition-colors">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <h3 class="text-base font-medium text-on-surface">{event.name}</h3>
                <span class="rounded-m3-sm bg-secondary-container px-2 py-0.5 text-xs text-on-secondary-container">{event.category}</span>
              </div>
              <p class="text-xs text-on-surface-variant mt-1">{event.description}</p>
            </div>
            <div class="flex items-center gap-2">
              <Button variant="secondary" size="sm" onclick={() => { selectedEvent = event; isEventModalOpen = true; }}>See More</Button>
              <Button variant="primary" size="sm" onclick={() => { selectedEvent = event; isEventModalOpen = true; }}>Sign Up</Button>
            </div>
          </li>
        {/each}
      </ul>
    </div>
  </div>

  <FilterPanel onReset={resetFilters}>
    <SearchInput bind:value={searchQuery} placeholder="Search events..." oninput={(v) => searchQuery = v} />
    <div class="flex flex-col gap-2 pt-2 border-t border-outline-variant/30">
      <span class="text-sm font-medium text-on-surface mb-1">Categories</span>
      {#each categories as cat}
        <Checkbox label={cat} bind:checked={selectedCategories[cat]} onchange={(val) => selectedCategories[cat] = val} />
      {/each}
    </div>
  </FilterPanel>

  <FilterDrawer isOpen={isFilterDrawerOpen} onClose={() => isFilterDrawerOpen = false} onReset={resetFilters}>
    <SearchInput bind:value={searchQuery} placeholder="Search events..." oninput={(v) => searchQuery = v} />
    <div class="flex flex-col gap-2 pt-2">
      <span class="text-sm font-medium text-on-surface mb-1">Categories</span>
      {#each categories as cat}
        <Checkbox label={cat} bind:checked={selectedCategories[cat]} onchange={(val) => selectedCategories[cat] = val} />
      {/each}
    </div>
  </FilterDrawer>
</div>

<EventDetailModal 
  isOpen={isEventModalOpen} 
  event={selectedEvent} 
  onClose={() => isEventModalOpen = false} 
/>
