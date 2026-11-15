<script lang="ts">
  import FilterPanel from '$components/layout/FilterPanel.svelte';
  import FilterDrawer from '$components/layout/FilterDrawer.svelte';
  import SearchInput from '$components/ui/SearchInput.svelte';
  import Chip from '$components/ui/Chip.svelte';
  import Checkbox from '$components/ui/Checkbox.svelte';
  import Button from '$components/ui/Button.svelte';
  import PdfPreviewModal from '$components/domain/reviewer/PdfPreviewModal.svelte';
  import { reviewerState } from '$stores/reviewer.svelte';
  import type { Reviewer } from '$mocks/reviewers';

  let searchQuery = $state('');
  let selectedCourse = $state<string>('All Courses');
  let selectedTags = $state<Record<string, boolean>>({
    Statics: true, Thermodynamics: true, Fluids: true, 'Machine Design': true
  });
  let savedOnly = $state(false);

  let isFilterDrawerOpen = $state(false);
  let selectedReviewer = $state<Reviewer | null>(null);
  let isPreviewModalOpen = $state(false);

  const courses = ['All Courses', 'ME 21', 'ME 31', 'ME 51', 'ME 41'];
  const tags = ['Statics', 'Thermodynamics', 'Fluids', 'Machine Design'];

  const filteredReviewers = $derived.by(() => {
    return reviewerState.reviewers.filter(r => {
      if (savedOnly && !r.bookmarked) return false;
      if (searchQuery && !r.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (selectedCourse !== 'All Courses' && r.courseCode !== selectedCourse) return false;
      if (!r.tags.some(t => selectedTags[t])) return false;
      return true;
    });
  });

  function resetFilters() {
    searchQuery = '';
    selectedCourse = 'All Courses';
    savedOnly = false;
    tags.forEach(t => selectedTags[t] = true);
  }
</script>

<svelte:head>
  <title>MEg-aral Reviewers — MEssentials</title>
</svelte:head>

<div class="flex flex-1 min-h-full">
  <div class="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto gap-4">
    <div class="flex md:hidden items-center justify-between">
      <h1 class="text-2xl font-normal text-on-surface">MEg-aral</h1>
      <button onclick={() => isFilterDrawerOpen = true} class="h-9 px-3 rounded-m3-sm bg-primary-container text-on-primary-container text-sm font-medium flex items-center gap-1">
        <span class="material-symbols-outlined text-[18px]">filter_list</span>
        Filters
      </button>
    </div>

    <ul class="flex flex-col gap-3">
      {#each filteredReviewers as reviewer (reviewer.id)}
        <li class="flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-4 rounded-m3-lg bg-surface border border-outline-variant/40 hover:border-primary transition-colors">
          <div class="size-12 rounded-m3-lg bg-surface-variant flex items-center justify-center text-primary shrink-0">
            <span class="material-symbols-outlined text-[24px]">picture_as_pdf</span>
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <h3 class="text-base font-medium text-on-surface">{reviewer.title}</h3>
              <span class="rounded-m3-sm bg-primary-container px-2 py-0.5 text-xs font-medium text-on-primary-container">{reviewer.courseCode}</span>
              {#if !reviewer.hasSelectableText}
                <span class="rounded-m3-sm bg-error-container px-2 py-0.5 text-xs font-medium text-on-error-container">Scanned PDF</span>
              {/if}
            </div>
            <p class="text-xs text-on-surface-variant mt-1">{reviewer.description}</p>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <button 
              onclick={() => reviewerState.toggleBookmark(reviewer.id)}
              aria-label="Bookmark"
              class={`size-9 rounded-m3-full flex items-center justify-center transition-colors ${reviewer.bookmarked ? 'text-primary bg-primary-container/40' : 'text-on-surface-variant hover:bg-surface-variant'}`}
            >
              <span class="material-symbols-outlined text-[20px]">{reviewer.bookmarked ? 'bookmark' : 'bookmark_border'}</span>
            </button>
            <Button variant="outlined" size="sm" onclick={() => { selectedReviewer = reviewer; isPreviewModalOpen = true; }}>Preview</Button>
            <Button variant="primary" size="sm" onclick={() => alert(`Downloading PDF...`)}>Download</Button>
          </div>
        </li>
      {/each}
    </ul>

    {#if filteredReviewers.length === 0}
      <div class="flex flex-col items-center justify-center flex-1 py-20 text-center">
        <span class="material-symbols-outlined text-[48px] text-outline-variant">{savedOnly ? 'bookmark' : 'search_off'}</span>
        <p class="text-lg font-medium text-on-surface mt-2">{savedOnly ? 'No saved reviewers yet' : 'No reviewers found'}</p>
        <p class="text-sm text-on-surface-variant mt-1">{savedOnly ? 'Bookmark reviewers to find them here.' : 'Try adjusting your search or filters.'}</p>
      </div>
    {/if}
  </div>

  <FilterPanel onReset={resetFilters}>
    <SearchInput bind:value={searchQuery} placeholder="Search reviewers..." oninput={(v) => searchQuery = v} />
    
    <div class="flex flex-col gap-2">
      <span class="text-sm font-medium text-on-surface mb-1">Courses</span>
      <div class="grid grid-cols-2 gap-2">
        {#each courses as course}
          <Chip selected={selectedCourse === course} onclick={() => selectedCourse = course}>{course}</Chip>
        {/each}
      </div>
    </div>

    <div class="flex flex-col gap-2">
      <span class="text-sm font-medium text-on-surface mb-1">Saved</span>
      <Chip selected={savedOnly} onclick={() => savedOnly = !savedOnly}>
        <span class="material-symbols-outlined text-[16px]">bookmark</span>
        Saved Only ({reviewerState.savedCount})
      </Chip>
    </div>

    <div class="flex flex-col gap-2 pt-2 border-t border-outline-variant/30">
      <span class="text-sm font-medium text-on-surface mb-1">Topic Tags</span>
      {#each tags as tag}
        <Checkbox label={tag} bind:checked={selectedTags[tag]} onchange={(val) => selectedTags[tag] = val} />
      {/each}
    </div>
  </FilterPanel>

  <FilterDrawer isOpen={isFilterDrawerOpen} onClose={() => isFilterDrawerOpen = false} onReset={resetFilters}>
    <SearchInput bind:value={searchQuery} placeholder="Search reviewers..." oninput={(v) => searchQuery = v} />
    <div class="flex flex-col gap-2">
      <span class="text-sm font-medium text-on-surface mb-1">Saved</span>
      <Chip selected={savedOnly} onclick={() => savedOnly = !savedOnly}>
        <span class="material-symbols-outlined text-[16px]">bookmark</span>
        Saved Only ({reviewerState.savedCount})
      </Chip>
    </div>
    <div class="flex flex-col gap-2 pt-2">
      <span class="text-sm font-medium text-on-surface mb-1">Topic Tags</span>
      {#each tags as tag}
        <Checkbox label={tag} bind:checked={selectedTags[tag]} onchange={(val) => selectedTags[tag] = val} />
      {/each}
    </div>
  </FilterDrawer>
</div>

<PdfPreviewModal 
  isOpen={isPreviewModalOpen} 
  reviewer={selectedReviewer} 
  onClose={() => isPreviewModalOpen = false} 
/>
