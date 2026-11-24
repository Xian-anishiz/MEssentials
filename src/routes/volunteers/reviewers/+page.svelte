<script lang="ts">
  import { goto } from '$app/navigation';
  import { reviewerState } from '$stores/reviewer.svelte';
  import Button from '$components/ui/Button.svelte';
  import Modal from '$components/ui/Modal.svelte';

  const reviewers = $derived(reviewerState.reviewers);

  function handleBack() {
    goto('/volunteers');
  }

  let reviewerModalOpen = $state(false);
  let editingId = $state<string | null>(null);
  let formTitle = $state('');
  let formCourseCode = $state('');
  let formTags = $state('');
  let formDescription = $state('');

  function resetReviewerForm() {
    editingId = null;
    formTitle = '';
    formCourseCode = '';
    formTags = '';
    formDescription = '';
    reviewerModalOpen = false;
  }

  function openUploadModal() {
    editingId = null;
    formTitle = '';
    formCourseCode = '';
    formTags = '';
    formDescription = '';
    reviewerModalOpen = true;
  }

  function openEditModal(id: string) {
    const reviewer = reviewers.find(r => r.id === id);
    if (!reviewer) return;
    editingId = id;
    formTitle = reviewer.title;
    formCourseCode = reviewer.courseCode;
    formTags = reviewer.tags.join(', ');
    formDescription = reviewer.description;
    reviewerModalOpen = true;
  }

  function handleSubmitReviewer() {
    if (!formTitle.trim() || !formCourseCode.trim()) return;
    const tags = formTags.split(',').map(t => t.trim()).filter(Boolean);

    if (editingId) {
      reviewerState.updateReviewer(editingId, {
        title: formTitle,
        courseCode: formCourseCode,
        description: formDescription,
        tags
      });
    } else {
      reviewerState.addReviewer({
        title: formTitle,
        courseCode: formCourseCode,
        description: formDescription,
        tags
      });
    }
    resetReviewerForm();
  }
</script>

<svelte:head><title>Reviewer Manager — MEssentials</title></svelte:head>

<div class="flex flex-col gap-6 p-4">
  <div class="flex items-center gap-3">
    <button onclick={handleBack} class="size-10 shrink-0 flex items-center justify-center rounded-m3-full bg-surface-variant text-on-surface-variant hover:bg-surface-container transition-colors">
      <span class="material-symbols-outlined">arrow_back</span>
    </button>
    <h1 class="text-xl sm:text-2xl font-normal text-on-surface">Reviewer Manager</h1>
    <div class="ml-auto hidden sm:flex items-center gap-2">
      <span class="material-symbols-outlined text-sm text-on-surface-variant">volunteer_activism</span>
      <span class="text-sm text-on-surface-variant">Reviewer Manager</span>
    </div>
  </div>

  <div class="flex items-center justify-between gap-4">
    <h2 class="text-xl font-normal text-on-surface">Reviewer Catalog</h2>
    <Button variant="tonal" onclick={openUploadModal}>
      <span class="material-symbols-outlined text-sm">cloud_upload</span>
      Upload Reviewer
    </Button>
  </div>

  <div class="rounded-m3-xl bg-surface border border-outline-variant/30 overflow-x-auto">
    <table class="w-full border-collapse">
      <thead>
        <tr class="border-b border-outline-variant/30">
          <th class="px-4 py-3 text-left text-sm font-medium text-on-surface">Title</th>
          <th class="px-4 py-3 text-left text-sm font-medium text-on-surface">Course</th>
          <th class="px-4 py-3 text-left text-sm font-medium text-on-surface">Type</th>
          <th class="px-4 py-3 text-right text-sm font-medium text-on-surface">Size</th>
          <th class="px-4 py-3 text-right text-sm font-medium text-on-surface">Modify</th>
        </tr>
      </thead>
      <tbody>
        {#each reviewers as reviewer (reviewer.id)}
          <tr class="border-b border-outline-variant/20 hover:bg-surface-container/30 transition-colors">
            <td class="px-4 py-3 text-sm text-on-surface">{reviewer.title}</td>
            <td class="px-4 py-3 text-sm text-on-surface">{reviewer.courseCode}</td>
            <td class="px-4 py-3 text-sm text-on-surface">
              {#if reviewer.hasSelectableText}
                <span class="inline-block px-2.5 py-0.5 rounded-m3-sm text-xs font-medium bg-secondary-container text-on-secondary-container">Text</span>
              {:else}
                <span class="inline-block px-2.5 py-0.5 rounded-m3-sm text-xs font-medium bg-amber-100 text-amber-900">Scanned PDF</span>
              {/if}
            </td>
            <td class="px-4 py-3 text-sm text-on-surface text-right">{reviewer.fileSize}</td>
            <td class="px-4 py-3 text-sm text-right">
              <button
                type="button"
                aria-label={`Modify ${reviewer.title}`}
                onclick={() => openEditModal(reviewer.id)}
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
</div>

<Modal isOpen={reviewerModalOpen} title={editingId ? 'Modify Reviewer' : 'Upload Reviewer'}>
  <form onsubmit={(e) => { e.preventDefault(); handleSubmitReviewer(); }} class="flex flex-col gap-4">
    <label class="flex flex-col gap-1.5">
      <span class="text-sm font-medium text-on-surface-variant">Title</span>
      <input type="text" bind:value={formTitle} required class="h-14 w-full rounded-m3-sm border border-outline bg-surface px-4 text-base text-on-surface" />
    </label>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <label class="flex flex-col gap-1.5">
        <span class="text-sm font-medium text-on-surface-variant">Course Code</span>
        <input type="text" bind:value={formCourseCode} required class="h-14 w-full rounded-m3-sm border border-outline bg-surface px-4 text-base text-on-surface" />
      </label>
      <label class="flex flex-col gap-1.5">
        <span class="text-sm font-medium text-on-surface-variant">Tags (comma-separated)</span>
        <input type="text" bind:value={formTags} class="h-14 w-full rounded-m3-sm border border-outline bg-surface px-4 text-base text-on-surface" />
      </label>
    </div>
    <label class="flex flex-col gap-1.5">
      <span class="text-sm font-medium text-on-surface-variant">Description / Summary</span>
      <textarea bind:value={formDescription} rows="3" class="w-full rounded-m3-sm border border-outline bg-surface px-4 py-3 text-base text-on-surface resize-y"></textarea>
    </label>
    {#if !editingId}
      <p class="text-xs text-on-surface-variant">Mockup: the file itself is not uploaded; a demo PDF entry is created with a simulated file size.</p>
    {/if}
    <div class="flex justify-end gap-2">
      <Button variant="text" type="button" onclick={resetReviewerForm}>Cancel</Button>
      <Button variant="primary" type="submit">{editingId ? 'Save Changes' : 'Upload Reviewer'}</Button>
    </div>
  </form>
</Modal>
