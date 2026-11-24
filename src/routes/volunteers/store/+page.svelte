<script lang="ts">
  import { goto } from '$app/navigation';
  import { storeState } from '$stores/store.svelte';
  import Button from '$components/ui/Button.svelte';
  import Modal from '$components/ui/Modal.svelte';

  const products = $derived(storeState.products);

  let productModalOpen = $state(false);
  let editingId = $state<string | null>(null);
  let formName = $state('');
  let formCategory = $state('');
  let formPrice = $state('');
  let formQuantity = $state('');

  function handleBack() {
    goto('/volunteers');
  }

  function resetProductForm() {
    editingId = null;
    formName = '';
    formCategory = '';
    formPrice = '';
    formQuantity = '';
    productModalOpen = false;
  }

  function openAddModal() {
    editingId = null;
    formName = '';
    formCategory = '';
    formPrice = '';
    formQuantity = '';
    productModalOpen = true;
  }

  function openEditModal(id: string) {
    const product = products.find(p => p.id === id);
    if (!product) return;
    editingId = id;
    formName = product.name;
    formCategory = product.category;
    formPrice = String(product.price);
    formQuantity = String(product.quantity);
    productModalOpen = true;
  }

  function handleSubmitProduct() {
    const price = Number(formPrice);
    const quantity = Number(formQuantity);
    if (!formName.trim() || !formCategory.trim() || Number.isNaN(price) || price <= 0 || Number.isNaN(quantity) || quantity < 0) return;

    if (editingId) {
      storeState.updateProduct(editingId, {
        name: formName.trim(),
        category: formCategory.trim(),
        price,
        quantity
      });
    } else {
      storeState.addProduct({
        name: formName.trim(),
        category: formCategory.trim(),
        price,
        cost: Math.round(price * 0.7 * 100) / 100,
        quantity
      });
    }
    resetProductForm();
  }
</script>

<svelte:head><title>Store Manager — MEssentials</title></svelte:head>

<div class="flex flex-col gap-6 p-4">
  <div class="flex items-center gap-3">
    <button onclick={handleBack} class="size-10 shrink-0 flex items-center justify-center rounded-m3-full bg-surface-variant text-on-surface-variant hover:bg-surface-container transition-colors">
      <span class="material-symbols-outlined">arrow_back</span>
    </button>
    <h1 class="text-xl sm:text-2xl font-normal text-on-surface">Store Manager</h1>
    <div class="ml-auto hidden sm:flex items-center gap-2">
      <span class="material-symbols-outlined text-sm text-on-surface-variant">volunteer_activism</span>
      <span class="text-sm text-on-surface-variant">Store Manager</span>
    </div>
  </div>

  {#if products.length === 0}
    <p class="text-on-surface-variant">No products found.</p>
  {:else}
    <div class="flex items-center justify-between gap-4">
      <h2 class="text-xl font-normal text-on-surface">Store Catalog</h2>
      <Button variant="tonal" onclick={openAddModal}>
        <span class="material-symbols-outlined text-sm">add</span>
        Add Product
      </Button>
    </div>
    <div class="rounded-m3-xl bg-surface border border-outline-variant/30 overflow-x-auto">
      <table class="w-full border-collapse">
        <thead>
          <tr class="border-b border-outline-variant/30">
            <th class="px-4 py-3 text-left text-sm font-medium text-on-surface">Name</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-on-surface">Category</th>
            <th class="px-4 py-3 text-right text-sm font-medium text-on-surface">Price</th>
            <th class="px-4 py-3 text-right text-sm font-medium text-on-surface">Stock</th>
            <th class="px-4 py-3 text-right text-sm font-medium text-on-surface">Modify</th>
          </tr>
        </thead>
        <tbody>
          {#each products as product (product.id)}
            <tr class="border-b border-outline-variant/20 hover:bg-surface-container/30 transition-colors">
              <td class="px-4 py-3 text-sm text-on-surface">{product.name}</td>
              <td class="px-4 py-3 text-sm text-on-surface">{product.category}</td>
              <td class="px-4 py-3 text-sm text-on-surface text-right">₱{product.price}</td>
              <td class="px-4 py-3 text-sm text-on-surface text-right">{product.quantity} units</td>
              <td class="px-4 py-3 text-sm text-right">
                <button
                  type="button"
                  aria-label={`Modify ${product.name}`}
                  onclick={() => openEditModal(product.id)}
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
  {/if}
</div>

<Modal isOpen={productModalOpen} title={editingId ? 'Modify Product' : 'Add Product'}>
  <form onsubmit={(e) => { e.preventDefault(); handleSubmitProduct(); }} class="flex flex-col gap-4">
    <label class="flex flex-col gap-1.5">
      <span class="text-sm font-medium text-on-surface-variant">Product Name</span>
      <input type="text" bind:value={formName} required class="h-14 w-full rounded-m3-sm border border-outline bg-surface px-4 text-base text-on-surface" />
    </label>
    <label class="flex flex-col gap-1.5">
      <span class="text-sm font-medium text-on-surface-variant">Category</span>
      <input type="text" bind:value={formCategory} required class="h-14 w-full rounded-m3-sm border border-outline bg-surface px-4 text-base text-on-surface" />
    </label>
    <div class="grid grid-cols-2 gap-4">
      <label class="flex flex-col gap-1.5">
        <span class="text-sm font-medium text-on-surface-variant">Price (₱)</span>
        <input type="number" min="1" step="0.01" bind:value={formPrice} required class="h-14 w-full rounded-m3-sm border border-outline bg-surface px-4 text-base text-on-surface" />
      </label>
      <label class="flex flex-col gap-1.5">
        <span class="text-sm font-medium text-on-surface-variant">Stock Quantity</span>
        <input type="number" min="0" bind:value={formQuantity} required class="h-14 w-full rounded-m3-sm border border-outline bg-surface px-4 text-base text-on-surface" />
      </label>
    </div>
    <div class="flex justify-end gap-2">
      <Button variant="text" type="button" onclick={resetProductForm}>Cancel</Button>
      <Button variant="primary" type="submit">{editingId ? 'Save Changes' : 'Add Product'}</Button>
    </div>
  </form>
</Modal>
