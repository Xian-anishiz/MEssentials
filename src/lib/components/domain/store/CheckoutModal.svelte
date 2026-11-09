<script lang="ts">
  import Modal from '$components/ui/Modal.svelte';
  import Button from '$components/ui/Button.svelte';
  import type { CartItem } from '$stores/store.svelte';

  type Props = {
    isOpen?: boolean;
    total?: number;
    itemsCount?: number;
    items?: CartItem[];
    onClose: () => void;
    onConfirm: () => void;
  };

  let { isOpen = false, total = 0, itemsCount = 0, items = [] as CartItem[], onClose, onConfirm }: Props = $props();
</script>

<Modal {isOpen} title="Confirm HonestME Checkout">
  <div class="flex flex-col gap-4">
    <p class="text-on-surface">You are checking out <strong>{itemsCount} item(s)</strong> with a total of <strong class="text-primary text-lg">₱{total}</strong>.</p>

    {#if items.length > 0}
      <div class="rounded-m3-lg border border-outline-variant/40 overflow-hidden">
        <div class="max-h-64 overflow-y-auto divide-y divide-outline-variant/30">
          {#each items as item (item.product.id)}
            <div class="flex items-center justify-between gap-3 px-4 py-3">
              <div class="min-w-0">
                <p class="text-sm font-medium text-on-surface truncate">{item.product.name}</p>
                <p class="text-xs text-on-surface-variant">₱{item.product.price} × {item.quantity}</p>
              </div>
              <span class="text-sm font-semibold text-on-surface shrink-0">₱{item.product.price * item.quantity}</span>
            </div>
          {/each}
        </div>
        <div class="flex items-center justify-between px-4 py-3 bg-surface-variant/50 border-t border-outline-variant/30">
          <span class="text-sm font-medium text-on-surface">Total</span>
          <span class="text-sm font-bold text-primary">₱{total}</span>
        </div>
      </div>
    {/if}

    <p class="text-xs text-on-surface-variant bg-surface-variant/50 p-3 rounded-m3-sm">
      Note: HonestME Store operates on an honesty system. Please drop exact cash in the box or verify your purchase total upon completion.
    </p>
  </div>
  {#snippet actions()}
    <Button variant="text" onclick={onClose}>Cancel</Button>
    <Button variant="primary" onclick={onConfirm}>Complete Checkout</Button>
  {/snippet}
</Modal>
