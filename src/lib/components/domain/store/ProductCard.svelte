<script lang="ts">
  import type { Product } from '$mocks/products';
  import { storeState } from '$stores/store.svelte';

  type Props = {
    product: Product;
  };

  let { product }: Props = $props();

  let qty = $derived(() => {
    const item = storeState.cartItems.find(i => i.product.id === product.id);
    return item ? item.quantity : 0;
  });

  function increase() {
    storeState.updateQuantity(product.id, 1);
  }

  function decrease() {
    storeState.updateQuantity(product.id, -1);
  }
</script>

<article class="rounded-m3-lg border border-outline-variant/60 overflow-hidden bg-surface hover:border-primary transition-colors flex flex-col">
  <div class="aspect-[4/3] bg-surface-variant flex items-center justify-center text-on-surface-variant relative">
    <span class="material-symbols-outlined text-[48px] text-outline-variant">shopping_bag</span>
    <span class="absolute top-3 right-3 rounded-m3-sm bg-surface/90 px-2 py-0.5 text-xs font-medium text-on-surface">Stock: {product.quantity}</span>
  </div>
  <div class="p-4 flex flex-col gap-3 flex-1 justify-between">
    <div class="flex items-start justify-between gap-2">
      <h3 class="text-base font-medium text-on-surface line-clamp-1">{product.name}</h3>
      <span class="rounded-m3-sm bg-secondary-container px-2 py-0.5 text-xs text-on-secondary-container shrink-0">{product.category}</span>
    </div>
    <div class="flex items-center justify-between mt-2">
      <span class="text-xl font-semibold text-on-surface">₱{product.price}</span>
      <div class="flex items-center gap-2">
        <button onclick={decrease} aria-label="Decrease" class="size-9 rounded-m3-full bg-secondary-container text-on-secondary-container flex items-center justify-center hover:brightness-95 active:scale-95 transition-all">
          <span class="material-symbols-outlined text-[18px]">remove</span>
        </button>
        <span class="w-6 text-center text-sm font-medium text-on-surface">{qty()}</span>
        <button onclick={increase} aria-label="Increase" class="size-9 rounded-m3-full bg-secondary-container text-on-secondary-container flex items-center justify-center hover:brightness-95 active:scale-95 transition-all">
          <span class="material-symbols-outlined text-[18px]">add</span>
        </button>
      </div>
    </div>
  </div>
</article>
