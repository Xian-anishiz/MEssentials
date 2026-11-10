<script lang="ts">
  import { goto } from '$app/navigation';
  import { borrowState } from '$stores/borrow.svelte';
  import Button from '$components/ui/Button.svelte';
  import Modal from '$components/ui/Modal.svelte';

  const items = $derived(borrowState.borrowables);

  function handleBack() {
    goto('/volunteers');
  }

  let itemModalOpen = $state(false);
  let editingId = $state<string | null>(null);
  let formName = $state('');
  let formCategory = $state('');
  let formUnitCount = $state('');

  function resetItemForm() {
    editingId = null;
    formName = '';
    formCategory = '';
    formUnitCount = '';
    itemModalOpen = false;
  }

  function openAddModal() {
    editingId = null;
    formName = '';
    formCategory = '';
    formUnitCount = '1';
    itemModalOpen = true;
  }

  function openEditModal(id: string) {
    const item = items.find(i => i.id === id);
    if (!item) return;
    editingId = id;
    formName = item.name;
    formCategory = item.category;
    formUnitCount = '0';
    itemModalOpen = true;
  }

  function handleSubmitItem() {
    const addCount = Number(formUnitCount) || 0;
    if (!formName.trim() || !formCategory.trim()) return;
    if (!editingId && addCount <= 0) return;
    if (editingId) {
      borrowState.updateBorrowable(editingId, { name: formName, category: formCategory, addUnits: addCount });
    } else {
      borrowState.addBorrowable({ name: formName, category: formCategory, unitCount: addCount });
    }
    resetItemForm();
  }
</script>

<svelte:head><title>Borrow Manager — MEssentials</title></svelte:head>

<div class="flex flex-col gap-6 p-4">
  <div class="flex items-center gap-3">
    <button onclick={handleBack} class="size-10 flex items-center justify-center rounded-m3-full bg-surface-variant text-on-surface-variant hover:bg-surface-container transition-colors">
      <span class="material-symbols-outlined">arrow_back</span>
    </button>
    <h1 class="text-2xl font-normal text-on-surface">Borrow Manager</h1>
    <div class="ml-auto flex items-center gap-2">
      <span class="material-symbols-outlined text-sm text-on-surface-variant">volunteer_activism</span>
      <span class="text-sm text-on-surface-variant">Borrow Manager</span>
    </div>
  </div>

  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-between gap-4">
      <h2 class="text-xl font-normal text-on-surface">Borrowable Catalog</h2>
      <Button variant="tonal" size="sm" onclick={openAddModal}>
        <span class="material-symbols-outlined text-sm">add</span>
        Add Item
      </Button>
    </div>
    <div class="rounded-m3-xl bg-surface border border-outline-variant/30 overflow-x-auto">
      <table class="w-full border-collapse">
        <thead>
          <tr class="border-b border-outline-variant/30">
            <th class="px-4 py-3 text-left text-sm font-medium text-on-surface">Item</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-on-surface">Category</th>
            <th class="px-4 py-3 text-right text-sm font-medium text-on-surface">Available</th>
            <th class="px-4 py-3 text-right text-sm font-medium text-on-surface">Modify</th>
          </tr>
        </thead>
        <tbody>
          {#each items as item (item.id)}
            {@const availableCount = item.units.filter(u => u.status === 'available').length}
            <tr class="border-b border-outline-variant/20 hover:bg-surface-container/30 transition-colors">
              <td class="px-4 py-3 text-sm text-on-surface">{item.name}</td>
              <td class="px-4 py-3 text-sm text-on-surface">{item.category}</td>
              <td class="px-4 py-3 text-sm text-on-surface text-right">{availableCount} / {item.units.length}</td>
              <td class="px-4 py-3 text-sm text-right">
                <button
                  type="button"
                  aria-label={`Modify ${item.name}`}
                  onclick={() => openEditModal(item.id)}
                  class="p-1.5 rounded-m3-full text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors"
                >
                  <span class="material-symbols-outlined text-[20px]">edit</span>
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>

  <div class="flex gap-3">
    <Button variant="tonal" onclick={handleBack}>
      <span class="material-symbols-outlined text-sm">arrow_back</span>
      Back to My Roles
    </Button>
  </div>
</div>

<Modal isOpen={itemModalOpen} title={editingId ? 'Modify Item' : 'Add Item'}>
  <form onsubmit={(e) => { e.preventDefault(); handleSubmitItem(); }} class="flex flex-col gap-4">
    <label class="flex flex-col gap-1.5">
      <span class="text-sm font-medium text-on-surface-variant">Item Name</span>
      <input type="text" bind:value={formName} required class="h-14 w-full rounded-m3-sm border border-outline bg-surface px-4 text-base text-on-surface" />
    </label>
    <label class="flex flex-col gap-1.5">
      <span class="text-sm font-medium text-on-surface-variant">Category</span>
      <input type="text" bind:value={formCategory} required class="h-14 w-full rounded-m3-sm border border-outline bg-surface px-4 text-base text-on-surface" />
    </label>
    <label class="flex flex-col gap-1.5">
      <span class="text-sm font-medium text-on-surface-variant">{editingId ? 'Additional Units to Add' : 'Number of Units'}</span>
      <input type="number" min={editingId ? '0' : '1'} bind:value={formUnitCount} required class="h-14 w-full rounded-m3-sm border border-outline bg-surface px-4 text-base text-on-surface" />
      {#if editingId}
        <span class="text-xs text-on-surface-variant">
          Current units: {items.find(i => i.id === editingId)?.units.length ?? 0}
          — labels continue from the existing numbering
        </span>
      {/if}
    </label>
    <div class="flex justify-end gap-2">
      <Button variant="text" type="button" onclick={resetItemForm}>Cancel</Button>
      <Button variant="primary" type="submit">{editingId ? 'Save Changes' : 'Add Item'}</Button>
    </div>
  </form>
</Modal>