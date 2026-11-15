<script lang="ts">
  import StatCard from '$components/ui/StatCard.svelte';
  import Badge from '$components/ui/Badge.svelte';
  import Button from '$components/ui/Button.svelte';
  import FilterPanel from '$components/layout/FilterPanel.svelte';
  import FilterDrawer from '$components/layout/FilterDrawer.svelte';
  import SearchInput from '$components/ui/SearchInput.svelte';
  import Checkbox from '$components/ui/Checkbox.svelte';
  import Chip from '$components/ui/Chip.svelte';
  import BorrowModal from '$components/domain/borrow/BorrowModal.svelte';
  import { borrowState } from '$stores/borrow.svelte';
  import type { BorrowableItem } from '$mocks/borrowables';

  let searchQuery = $state('');
  let filterMode = $state<'all' | 'available'>('all');
  let selectedCategories = $state<Record<string, boolean>>({
    'school supplies': true,
    'utilities': true,
    'recreational': true
  });

  let isFilterDrawerOpen = $state(false);
  let selectedBorrowItem = $state<BorrowableItem | null>(null);
  let isBorrowModalOpen = $state(false);

  const categories = ['school supplies', 'utilities', 'recreational'];

  const filteredBorrowables = $derived.by(() => {
    return borrowState.borrowables.filter(b => {
      if (searchQuery && !b.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (!selectedCategories[b.category]) return false;
      if (filterMode === 'available' && !b.units.some(u => u.status === 'available')) return false;
      return true;
    });
  });

  function availableUnitCount(item: BorrowableItem): number {
    return item.units.filter(u => u.status === 'available').length;
  }

  function openBorrowModal(item: BorrowableItem) {
    selectedBorrowItem = item;
    isBorrowModalOpen = true;
  }

  function resetFilters() {
    searchQuery = '';
    filterMode = 'all';
    categories.forEach(c => selectedCategories[c] = true);
  }

  const categoryLabels: Record<string, string> = {
    'school supplies': 'School Supplies',
    'utilities': 'Utilities',
    'recreational': 'Recreational'
  };
</script>

<svelte:head>
  <title>ME-kailangan Borrow — MEssentials</title>
</svelte:head>


<div class="flex flex-1 min-h-full">
  <div class="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto gap-6">
    <div class="flex md:hidden items-center justify-between">
      <h1 class="text-2xl font-normal text-on-surface">ME-kailangan</h1>
      <button onclick={() => isFilterDrawerOpen = true} class="h-9 px-3 rounded-m3-sm bg-primary-container text-on-primary-container text-sm font-medium flex items-center gap-1">
        <span class="material-symbols-outlined text-[18px]">filter_list</span>
        Filters
      </button>
    </div>

    <!-- Stat Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatCard label="Items on loan" value={`${borrowState.loans.length} active`} />
      <StatCard label="Due within 7 days" value={`${borrowState.dueSoonCount} item(s)`} highlight={borrowState.dueSoonCount > 0} />
      <StatCard label="Overdue" value={`${borrowState.overdueCount} item(s)`} highlight={borrowState.overdueCount > 0} />
    </div>

        <!-- On Loan Section -->
    <div class="flex flex-col gap-3">
      <h2 class="text-xl font-medium text-on-surface">Items On Loan</h2>
      {#if borrowState.loans.length > 0}
        <ul class="flex flex-col gap-2">
          {#each borrowState.loans as loan (loan.id)}
            <li class="flex items-center gap-4 px-4 py-3 rounded-m3-lg bg-surface-variant/40 border border-outline-variant/30">
              <div class="size-12 rounded-m3-lg bg-surface-variant flex items-center justify-center text-primary shrink-0">
                <span class="material-symbols-outlined text-[24px]">inventory_2</span>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-base font-medium text-on-surface truncate">{loan.itemName}</p>
                <p class="text-xs text-on-surface-variant">Unit: {loan.unitLabel} • Due: {loan.dueAt}</p>
              </div>
              <div class="flex items-center gap-2">
                {#if loan.status === 'overdue'}
                  <Badge variant="error">Overdue</Badge>
                {:else if loan.status === 'due_soon'}
                  <Badge variant="secondary">Due Soon</Badge>
                {:else}
                  <Badge variant="primary">Active</Badge>
                {/if}
                <Button variant="outlined" size="sm" onclick={() => borrowState.returnLoan(loan.id)}>Return</Button>
              </div>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="text-sm text-on-surface-variant italic">You have no active loans.</p>
      {/if}
    </div>

    <!-- Available for Borrow Section -->
    <div class="flex flex-col gap-3">
      <h2 class="text-xl font-medium text-on-surface">Available for Borrow</h2>
      <ul class="flex flex-col gap-2">
        {#each filteredBorrowables as item (item.id)}
          {@const availCount = availableUnitCount(item)}
          <li class="flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-4 rounded-m3-lg bg-surface border border-outline-variant/40 hover:border-primary transition-colors">
            <div class="size-12 rounded-m3-lg bg-surface-variant flex items-center justify-center text-primary shrink-0">
              <span class="material-symbols-outlined text-[24px]">inventory_2</span>
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="text-base font-medium text-on-surface">{item.name}</h3>
                <span class="rounded-m3-sm bg-primary-container px-2 py-0.5 text-xs font-medium text-on-primary-container capitalize">{categoryLabels[item.category] ?? item.category}</span>
              </div>
              <p class="text-xs text-on-surface-variant mt-1">{item.description}</p>
              <div class="flex items-center gap-2 mt-2">
                {#if availCount > 0}
                  <Badge variant="primary">{availCount} of {item.units.length} units available</Badge>
                {:else}
                  <Badge variant="error">No units available</Badge>
                {/if}
              </div>
            </div>

            <div class="flex items-center sm:justify-end shrink-0">
              <Button 
                variant="primary" 
                size="sm" 
                disabled={availCount === 0}
                onclick={() => openBorrowModal(item)}
              >
                <span class="material-symbols-outlined text-[16px]">add_circle</span>
                Borrow
              </Button>
            </div>
          </li>
        {/each}
      </ul>

      {#if filteredBorrowables.length === 0}
        <div class="flex flex-col items-center justify-center py-12 text-center">
          <span class="material-symbols-outlined text-[48px] text-outline-variant">search_off</span>
          <p class="text-lg font-medium text-on-surface mt-2">No borrowable items found</p>
          <p class="text-sm text-on-surface-variant mt-1">Try adjusting your search or filters.</p>
        </div>
      {/if}
    </div>
  </div>

  <!-- Desktop Filter Panel -->
  <FilterPanel onReset={resetFilters}>
    <SearchInput bind:value={searchQuery} placeholder="Search borrowable items..." oninput={(v) => searchQuery = v} />

    <div class="flex flex-col gap-2">
      <span class="text-sm font-medium text-on-surface mb-1">Availability</span>
      <div class="grid grid-cols-2 gap-2">
        <Chip selected={filterMode === 'all'} onclick={() => filterMode = 'all'}>All Items</Chip>
        <Chip selected={filterMode === 'available'} onclick={() => filterMode = 'available'}>Available Only</Chip>
      </div>
    </div>

    <div class="flex flex-col gap-2 pt-2 border-t border-outline-variant/30">
      <span class="text-sm font-medium text-on-surface mb-1">Categories</span>
      {#each categories as cat}
        <Checkbox
          label={categoryLabels[cat]}
          bind:checked={selectedCategories[cat]}
          onchange={(val) => selectedCategories[cat] = val}
          count={borrowState.borrowables.filter(b => b.category === cat).length}
        />
      {/each}
    </div>
  </FilterPanel>

  <!-- Mobile Filter Drawer -->
  <FilterDrawer isOpen={isFilterDrawerOpen} onClose={() => isFilterDrawerOpen = false} onReset={resetFilters}>
    <SearchInput bind:value={searchQuery} placeholder="Search borrowable items..." oninput={(v) => searchQuery = v} />
    <div class="flex flex-col gap-2">
      <span class="text-sm font-medium text-on-surface mb-1">Availability</span>
      <div class="grid grid-cols-2 gap-2">
        <Chip selected={filterMode === 'all'} onclick={() => filterMode = 'all'}>All Items</Chip>
        <Chip selected={filterMode === 'available'} onclick={() => filterMode = 'available'}>Available Only</Chip>
      </div>
    </div>
    <div class="flex flex-col gap-2 pt-2">
      <span class="text-sm font-medium text-on-surface mb-1">Categories</span>
      {#each categories as cat}
        <Checkbox
          label={categoryLabels[cat]}
          bind:checked={selectedCategories[cat]}
          onchange={(val) => selectedCategories[cat] = val}
        />
      {/each}
    </div>
  </FilterDrawer>
</div>

<BorrowModal
  isOpen={isBorrowModalOpen}
  item={selectedBorrowItem}
  onClose={() => isBorrowModalOpen = false}
/>
