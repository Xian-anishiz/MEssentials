<script lang="ts">
  type Props = {
    label: string;
    sortKey: string;
    activeKey: string;
    direction: 'asc' | 'desc';
    onsort: (key: string) => void;
  };

  let { label, sortKey, activeKey, direction, onsort }: Props = $props();

  const isSorted = $derived(activeKey === sortKey);
  const ariaSort = $derived(isSorted ? (direction === 'asc' ? 'ascending' : 'descending') : 'none');
</script>

<th
  class={`px-4 py-3 text-left ${isSorted ? 'text-on-surface' : 'text-on-surface-variant'}`}
  aria-sort={ariaSort}
>
  <button
    type="button"
    onclick={() => onsort(sortKey)}
    class="group inline-flex items-center gap-1 text-sm font-medium hover:text-primary focus-visible:text-primary outline-none transition-colors cursor-pointer select-none"
  >
    <span>{label}</span>
    <span
      class={`material-symbols-outlined text-[16px] transition-opacity ${isSorted ? 'opacity-100' : 'opacity-40 group-hover:opacity-70'}`}
      aria-hidden="true"
    >{isSorted ? (direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}</span>
  </button>
</th>
