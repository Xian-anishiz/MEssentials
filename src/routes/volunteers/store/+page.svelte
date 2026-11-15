<script lang="ts">
  import { goto } from '$app/navigation';
  import { storeState } from '$stores/store.svelte';
  import Button from '$components/ui/Button.svelte';
  import Modal from '$components/ui/Modal.svelte';

  const products = $derived(storeState.products);

  let addModalOpen = $state(false);
  let newName = $state('');
  let newCategory = $state('');
  let newPrice = $state('');
  let newQuantity = $state('');

  function handleBack() {
    goto('/volunteers');
  }

  function resetAddForm() {
    newName = '';
    newCategory = '';
    newPrice = '';
    newQuantity = '';
    addModalOpen = false;
  }

  function handleAddProduct() {
    const price = Number(newPrice);
    const quantity = Number(newQuantity);
    if (!newName.trim() || !newCategory.trim() || Number.isNaN(price) || price <= 0 || Number.isNaN(quantity) || quantity < 0) return;
    storeState.addProduct({ name: newName.trim(), category: newCategory.trim(), price, cost: Math.round(price * 0.7 * 100) / 100, quantity });
    resetAddForm();
  }
</script>

<svelte:head><title>Store Manager — MEssentials</title></svelte:head>

<div class="flex flex-col gap-6 p-4">
  <div class="flex items-center gap-3">
    <button onclick={handleBack} class="size-10 flex items-center justify-center rounded-m3-full bg-surface-variant text-on-surface-variant hover:bg-surface-container transition-colors">
      <span class="material-symbols-outlined">arrow_back</span>
    </button>
    <h1 class="text-2xl font-normal text-on-surface">Store Manager</h1>
    <div class="flex items-center gap-3 ml-auto">
      <span class="material-symbols-outlined text-sm text-on-surface-variant">volunteer_activism</span>
      <span class="text-sm text-on-surface-variant">Store Manager</span>
    </div>
  </div>

  {#if products.length === 0}
    <p class="text-on-surface-variant">No products found.</p>
  {:else}
    <div class="rounded-m3-xl bg-surface border border-outline-variant/30 overflow-x-auto">
      <table class="w-full border-collapse">
        <thead>
          <tr class="border-b border-outline-variant/30">
            <th class="px-4 py-3 text-left text-sm font-medium text-on-surface">Name</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-on-surface">Category</th>
            <th class="px-4 py-3 text-right text-sm font-medium text-on-surface">Price</th>
            <th class="px-4 py-3 text-right text-sm font-medium text-on-surface">Stock</th>
          </tr>
        </thead>
        <tbody>
          {#each products as product}
            <tr class="border-b border-outline-variant/20 hover:bg-surface-container/30 transition-colors">
              <td class="px-4 py-3 text-sm text-on-surface">{product.name}</td>
              <td class="px-4 py-3 text-sm text-on-surface">{product.category}</td>
              <td class="px-4 py-3 text-sm text-on-surface text-right">₱{product.price}</td>
              <td class="px-4 py-3 text-sm text-on-surface text-right">{product.quantity} units</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}

  <div class="flex gap-3">
    <Button variant="tonal" onclick={() => { addModalOpen = true; }}>
      <span class="material-symbols-outlined text-sm">add</span>
      Add Product
    </Button>
  </div>
</div>

<Modal isOpen={addModalOpen} title="Add Product">
  <form onsubmit={(e) => { e.preventDefault(); handleAddProduct(); }} class="flex flex-col gap-4">
    <label class="flex flex-col gap-1.5">
      <span class="text-sm font-medium text-on-surface-variant">Product Name</span>
      <input type="text" bind:value={newName} required class="h-14 w-full rounded-m3-sm border border-outline bg-surface px-4 text-base text-on-surface" />
    </label>
    <label class="flex flex-col gap-1.5">
      <span class="text-sm font-medium text-on-surface-variant">Category</span>
      <input type="text" bind:value={newCategory} required class="h-14 w-full rounded-m3-sm border border-outline bg-surface px-4 text-base text-on-surface" />
    </label>
    <div class="grid grid-cols-2 gap-4">
      <label class="flex flex-col gap-1.5">
        <span class="text-sm font-medium text-on-surface-variant">Price (₱)</span>
        <input type="number" min="1" step="0.01" bind:value={newPrice} required class="h-14 w-full rounded-m3-sm border border-outline bg-surface px-4 text-base text-on-surface" />
      </label>
      <label class="flex flex-col gap-1.5">
        <span class="text-sm font-medium text-on-surface-variant">Stock Quantity</span>
        <input type="number" min="0" bind:value={newQuantity} required class="h-14 w-full rounded-m3-sm border border-outline bg-surface px-4 text-base text-on-surface" />
      </label>
    </div>
    <div class="flex justify-end gap-2">
      <Button variant="text" type="button" onclick={resetAddForm}>Cancel</Button>
      <Button variant="primary" type="submit">Add Product</Button>
    </div>
  </form>
</Modal>