<script lang="ts">
  let {
    currentPage = 1,
    totalPages,
    totalItems,
    pageSize = 10,
    onPageChange,
  }: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize?: number;
    onPageChange: (page: number) => void;
  } = $props();

  const pagesToShow = $derived.by(() => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    pages.push(1);

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    if (start > 2) pages.push('ellipsis');

    for (let i = start; i <= end; i++) pages.push(i);

    if (end < totalPages - 1) pages.push('ellipsis');

    pages.push(totalPages);

    return pages;
  });

  function goToPage(page: number) {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  }

  function goToPrevious() {
    goToPage(currentPage - 1);
  }

  function goToNext() {
    goToPage(currentPage + 1);
  }

  const startItem = $derived((currentPage - 1) * pageSize + 1);
  const endItem = $derived(Math.min(currentPage * pageSize, totalItems));
</script>

<nav class="flex items-center justify-between px-4 py-3 border-t border-outline-variant/30" aria-label="Pagination">
  <div class="text-sm text-on-surface-variant">
    Showing <span class="font-medium">{startItem}</span>–<span class="font-medium">{endItem}</span> of <span class="font-medium">{totalItems}</span> items
  </div>

  <div class="flex items-center gap-1">
    <button
      type="button"
      onclick={goToPrevious}
      disabled={currentPage === 1}
      class="size-8 rounded-m3-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container disabled:opacity-38 disabled:cursor-not-allowed transition-colors"
      aria-label="Previous page"
    >
      <span class="material-symbols-outlined">chevron_left</span>
    </button>

    {#each pagesToShow as page}
      {#if page === 'ellipsis'}
        <span class="px-2 text-on-surface-variant/50">…</span>
      {:else}
        <button
          type="button"
          onclick={() => goToPage(page)}
          class={`size-8 rounded-m3-full flex items-center justify-center text-sm font-medium transition-colors ${currentPage === page ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container'}`}
          aria-label="Page {page}"
          aria-current={currentPage === page ? 'page' : undefined}
        >
          {page}
        </button>
      {/if}
    {/each}

    <button
      type="button"
      onclick={goToNext}
      disabled={currentPage === totalPages}
      class="size-8 rounded-m3-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container disabled:opacity-38 disabled:cursor-not-allowed transition-colors"
      aria-label="Next page"
    >
      <span class="material-symbols-outlined">chevron_right</span>
    </button>
  </div>
</nav>