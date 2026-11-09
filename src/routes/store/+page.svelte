<script lang="ts">
  import ProductCard from '$components/domain/store/ProductCard.svelte';
  import CheckoutModal from '$components/domain/store/CheckoutModal.svelte';
  import FilterPanel from '$components/layout/FilterPanel.svelte';
  import FilterDrawer from '$components/layout/FilterDrawer.svelte';
  import SearchInput from '$components/ui/SearchInput.svelte';
  import RangeSlider from '$components/ui/RangeSlider.svelte';
  import Checkbox from '$components/ui/Checkbox.svelte';
  import Chip from '$components/ui/Chip.svelte';
  import Button from '$components/ui/Button.svelte';
  import { storeState, type CartItem } from '$stores/store.svelte';

  let searchQuery = $state('');
  let maxPrice = $state(300);
  let selectedCategories = $state<Record<string, boolean>>({
    Chips: true, Coffee: true, Candy: true, Stationery: true, Biscuits: true
  });

  let isFilterDrawerOpen = $state(false);
  let isCheckoutModalOpen = $state(false);

  const categories = ['Chips', 'Coffee', 'Candy', 'Stationery', 'Biscuits'];

  const filteredProducts = $derived.by(() => {
    return storeState.products.filter(p => {
      if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (p.price > maxPrice) return false;
      if (!selectedCategories[p.category]) return false;
      return true;
    });
  });

  function resetFilters() {
    searchQuery = '';
    maxPrice = 300;
    categories.forEach(c => selectedCategories[c] = true);
  }

  function handleCheckoutConfirm() {
    storeState.clearCart();
    isCheckoutModalOpen = false;
    alert('HonestME Store checkout recorded successfully!');
  }
</script>

<svelte:head>
  <title>HonestME Store — MEssentials</title>
</svelte:head>

{#snippet cartItemCard(item: CartItem)}
  <div class="flex flex-col gap-1 p-2 rounded-m3-sm bg-surface-variant/40 border border-outline-variant/30">
    <div class="flex items-center justify-between gap-2">
      <span class="text-sm font-medium text-on-surface truncate">{item.product.name}</span>
      <button
        aria-label={`Remove one ${item.product.name}`}
        onclick={() => storeState.updateQuantity(item.product.id, -1)}
        class="size-8 shrink-0 rounded-m3-full flex items-center justify-center text-on-surface-variant hover:bg-error-container/40 hover:text-error transition-colors"
      >
        <span class="material-symbols-outlined text-[18px]">delete</span>
      </button>
    </div>
    <div class="flex items-center justify-between">
      <span class="text-xs text-on-surface-variant">₱{item.product.price} each</span>
      <div class="flex items-center gap-1">
        <button
          aria-label="Decrease quantity"
          onclick={() => storeState.updateQuantity(item.product.id, -1)}
          class="size-7 rounded-m3-full flex items-center justify-center text-on-surface-variant hover:bg-surface-variant transition-colors"
        >
          <span class="material-symbols-outlined text-[16px]">remove</span>
        </button>
        <span class="text-sm font-medium text-on-surface w-6 text-center">{item.quantity}</span>
        <button
          aria-label="Increase quantity"
          onclick={() => storeState.updateQuantity(item.product.id, 1)}
          class="size-7 rounded-m3-full flex items-center justify-center text-on-surface-variant hover:bg-surface-variant transition-colors"
        >
          <span class="material-symbols-outlined text-[16px]">add</span>
        </button>
      </div>
    </div>
  </div>
{/snippet}

{#snippet cartSummary()}
  <div class="flex justify-between text-sm text-on-surface-variant">
    <span>Cart Items ({storeState.cartItemCount})</span>
    <span class="font-semibold text-on-surface">₱{storeState.cartTotal}</span>
  </div>
{/snippet}

{#snippet cartSection(listClass: string)}
  {@render cartSummary()}
  {#if storeState.cartItems.length > 0}
    <div class={listClass}>
      {#each storeState.cartItems as item (item.product.id)}
        {@render cartItemCard(item)}
      {/each}
    </div>
  {:else}
    <p class="text-xs text-on-surface-variant text-center py-2">Your cart is empty. Add products to check out.</p>
  {/if}
  <Button
    variant="tonal"
    size="md"
    class="w-full rounded-m3-full"
    disabled={storeState.cartItemCount === 0}
    onclick={() => isCheckoutModalOpen = true}
  >
    <span class="material-symbols-outlined text-[18px]">shopping_cart_checkout</span>
    Check Out
  </Button>
{/snippet}

<div class="flex flex-1 min-h-full">
  <div class="flex-1 flex flex-col p-4 pb-0 md:p-6 overflow-y-auto gap-4">
    <div class="flex md:hidden items-center justify-between mb-0">
      <h1 class="text-2xl font-normal text-on-surface">HonestME Store</h1>
      <button onclick={() => isFilterDrawerOpen = true} class="h-9 px-3 rounded-m3-sm bg-primary-container text-on-primary-container text-sm font-medium flex items-center gap-1">
        <span class="material-symbols-outlined text-[18px]">filter_list</span>
        Filters
      </button>
    </div>

    <ul class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {#each filteredProducts as product (product.id)}
        <li>
          <ProductCard {product} />
        </li>
      {/each}
    </ul>

    {#if filteredProducts.length === 0}
      <div class="flex flex-col items-center justify-center flex-1 py-20 text-center">
        <span class="material-symbols-outlined text-[48px] text-outline-variant">search_off</span>
        <p class="text-lg font-medium text-on-surface mt-2">No products found</p>
      </div>
    {/if}

    <!-- Mobile Cart: sticky bar pinned to the bottom of the screen -->
    <div
      aria-label="Cart"
      class="md:hidden sticky bottom-0 mt-auto -mx-4 -mb-4 px-4 pt-3 pb-4 bg-surface border-t border-outline-variant/60 shadow-m3-2 flex items-center justify-between gap-3"
    >
      <div class="flex flex-col min-w-0">
        <span class="text-sm font-medium text-on-surface">Cart Items ({storeState.cartItemCount})</span>
        <span class="text-lg font-bold text-primary leading-tight">₱{storeState.cartTotal}</span>
      </div>
      <Button
        variant="tonal"
        size="md"
        class="rounded-m3-full shrink-0"
        disabled={storeState.cartItemCount === 0}
        onclick={() => isCheckoutModalOpen = true}
      >
        <span class="material-symbols-outlined text-[18px]">shopping_cart_checkout</span>
        Check Out
      </Button>
    </div>
  </div>

  <FilterPanel onReset={resetFilters}>
    <SearchInput bind:value={searchQuery} placeholder="Search products..." oninput={(v) => searchQuery = v} />

    <div class="flex flex-col gap-3">
      <span class="text-sm font-medium text-on-surface">Price Range</span>
      <RangeSlider min={0} max={300} bind:value={maxPrice} />
    </div>

    <div class="flex flex-col gap-2">
      <span class="text-sm font-medium text-on-surface mb-1">Quick Select</span>
      <div class="flex flex-wrap gap-2">
        <Chip onclick={() => maxPrice = 50} selected={maxPrice === 50}>Under ₱50</Chip>
        <Chip onclick={() => maxPrice = 100} selected={maxPrice === 100}>₱50-₱100</Chip>
        <Chip onclick={() => maxPrice = 150} selected={maxPrice === 150}>₱100-₱150</Chip>
        <Chip onclick={() => maxPrice = 300} selected={maxPrice === 300}>₱150+</Chip>
      </div>
    </div>

    <div class="flex flex-col gap-2 pt-2 border-t border-outline-variant/30">
      <span class="text-sm font-medium text-on-surface mb-1">Categories</span>
      {#each categories as cat}
        <Checkbox
          label={cat}
          bind:checked={selectedCategories[cat]}
          onchange={(val) => selectedCategories[cat] = val}
          count={storeState.products.filter(p => p.category === cat).length}
        />
      {/each}
    </div>

    <div class="mt-auto pt-6 border-t border-outline-variant/40 flex flex-col gap-3">
      {@render cartSection('flex flex-col gap-2')}
    </div>
  </FilterPanel>

  <FilterDrawer isOpen={isFilterDrawerOpen} onClose={() => isFilterDrawerOpen = false} onReset={resetFilters}>
    <SearchInput bind:value={searchQuery} placeholder="Search products..." oninput={(v) => searchQuery = v} />
    <div class="flex flex-col gap-3">
      <span class="text-sm font-medium text-on-surface">Price Range</span>
      <RangeSlider min={0} max={300} bind:value={maxPrice} />
    </div>
    <div class="flex flex-col gap-2 pt-2">
      <span class="text-sm font-medium text-on-surface mb-1">Categories</span>
      {#each categories as cat}
        <Checkbox
          label={cat}
          bind:checked={selectedCategories[cat]}
          onchange={(val) => selectedCategories[cat] = val}
        />
      {/each}
    </div>
    <p class="text-xs text-on-surface-variant text-center pt-2 border-t border-outline-variant/30">
      Your cart and checkout button are below the product list.
    </p>
  </FilterDrawer>
</div>

<CheckoutModal
  isOpen={isCheckoutModalOpen}
  total={storeState.cartTotal}
  itemsCount={storeState.cartItemCount}
  items={storeState.cartItems}
  onClose={() => isCheckoutModalOpen = false}
  onConfirm={handleCheckoutConfirm}
/>
