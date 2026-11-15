<script lang="ts">
  let {
    columns,
    data,
    sortKey = 'id',
    sortDirection = 'asc',
    onSort,
    emptyMessage = 'No data available',
    loading = false,
    rowKey = 'id',
  }: {
    columns: { key: string; label: string; sortable?: boolean; align?: 'left' | 'center' | 'right'; render?: (row: any) => string }[];
    data: any[];
    sortKey?: string;
    sortDirection?: 'asc' | 'desc';
    onSort?: (key: string, direction: 'asc' | 'desc') => void;
    emptyMessage?: string;
    loading?: boolean;
    rowKey?: string;
  } = $props();

  function handleHeaderClick(key: string) {
    const newDirection = sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort?.(key, newDirection);
  }
</script>

{#if loading}
  <div class="w-full overflow-x-auto">
    <table class="w-full border-collapse">
      <thead>
        <tr class="border-b border-outline-variant/30">
          {#each columns as col}
            <th class="px-4 py-3 text-left text-sm font-medium text-on-surface-variant" style="text-align: {col.align || 'left'}">{col.label}</th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each Array(5) as _}
          <tr class="border-b border-outline-variant/20">
            {#each columns as col}
              <td class="px-4 py-3 text-sm text-on-surface-variant animate-pulse bg-surface-container/50"><div class="h-4 w-3/4 bg-surface-variant rounded"></div></td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{:else if data.length === 0}
  <div class="w-full flex flex-col items-center justify-center py-12 px-4">
    <span class="material-symbols-outlined text-6xl text-on-surface-variant/30">inbox</span>
    <p class="mt-2 text-on-surface-variant">{emptyMessage}</p>
  </div>
{:else}
  <div class="w-full overflow-x-auto">
    <table class="w-full border-collapse">
      <thead>
        <tr class="border-b border-outline-variant/30">
          {#each columns as col}
            <th
              class="px-4 py-3 text-left text-sm font-medium text-on-surface-variant cursor-pointer select-none hover:bg-surface-container/30 transition-colors"
              style="text-align: {col.align || 'left'}"
              onclick={col.sortable ? () => handleHeaderClick(col.key) : undefined}
            >
              <div class="flex items-center gap-1.5">
                {col.label}
                {#if col.sortable}
                  {#if sortKey === col.key}
                    <span class="material-symbols-outlined text-sm text-primary" aria-hidden="true">{sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>
                  {:else}
                    <span class="material-symbols-outlined text-sm text-on-surface-variant/50" aria-hidden="true">unfold_more</span>
                  {/if}
                {/if}
              </div>
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each data as row (row[rowKey])}
          <tr class="border-b border-outline-variant/20 hover:bg-surface-container/30 transition-colors">
            {#each columns as col}
              <td class="px-4 py-3 text-sm text-on-surface" style="text-align: {col.align || 'left'}">
                {#if col.render}
                  {col.render(row)}
                {:else}
                  {row[col.key] ?? '—'}
                {/if}
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}