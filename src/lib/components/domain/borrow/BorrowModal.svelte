  <script lang="ts">
    import Modal from '$components/ui/Modal.svelte';
    import Button from '$components/ui/Button.svelte';
    import TextField from '$components/ui/TextField.svelte';
    import type { BorrowableItem } from '$mocks/borrowables';
    import { borrowState } from '$stores/borrow.svelte';

    type Props = {
      isOpen?: boolean;
      item: BorrowableItem | null;
      onClose: () => void;
    };

    let {
      isOpen = false,
      item,
      onClose
    }: Props = $props();

    let selectedUnitId = $state<string>('');
    let dueAt = $state<string>('2026-11-20');

    $effect(() => {
      if (item && item.units.length > 0) {
        const avail = item.units.find(u => u.status === 'available');
        selectedUnitId = avail ? avail.id : item.units[0].id;
      }
    });

    function handleBorrow() {
      if (!item || !selectedUnitId) return;
      borrowState.borrowUnit(item.id, selectedUnitId, dueAt);
      onClose();
    }
  </script>

  <Modal {isOpen} title={`Borrow: ${item?.name || ''}`}>
    <div class="flex flex-col gap-4">
      <p class="text-sm text-on-surface-variant">{item?.description}</p>
      
      <div class="flex flex-col gap-2">
        <label
          for="unit-select"
          class="text-sm font-medium text-on-surface-variant"
        >
          Select Available Unit
        </label>

        <select
          id="unit-select"
          bind:value={selectedUnitId}
          class="h-12 px-4 rounded-m3-sm bg-surface-variant/40 border border-outline-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {#if item}
            {#each item.units as unit}
              <option value={unit.id} disabled={unit.status !== 'available'}>
                {unit.label} ({unit.status === 'available' ? 'Available' : 'Currently Borrowed'})
              </option>
            {/each}
          {/if}
        </select>
      </div>

      <TextField label="Expected Return Date" type="date" value={dueAt} oninput={(v) => dueAt = v} required />
    </div>
    {#snippet actions()}
      <Button variant="text" onclick={onClose}>Cancel</Button>
      <Button variant="primary" onclick={handleBorrow}>Confirm Borrow</Button>
    {/snippet}
  </Modal>
