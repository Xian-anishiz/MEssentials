<script lang="ts">
  import { goto } from '$app/navigation';
  import { reviewerState } from '$stores/reviewer.svelte';
  import Button from '$components/ui/Button.svelte';
  import Modal from '$components/ui/Modal.svelte';

  const reviewers = $derived(reviewerState.reviewers);

  function handleBack() {
    goto('/volunteers');
  }

  let uploadModalOpen = $state(false);
  let newTitle = $state('');
  let newCourseCode = $state('');
  let newTags = $state('');
  let newDescription = $state('');

  function resetUploadForm() {
    newTitle = '';
    newCourseCode = '';
    newTags = '';
    newDescription = '';
    uploadModalOpen = false;
  }

  function handleUploadReviewer() {
    if (!newTitle.trim() || !newCourseCode.trim()) return;
    reviewerState.addReviewer({
      title: newTitle,
      courseCode: newCourseCode,
      description: newDescription,
      tags: newTags.split(',').map(t => t.trim()).filter(Boolean)
    });
    resetUploadForm();
  }
</script>

<svelte:head><title>Reviewer Manager — MEssentials</title></svelte:head>

<div class="flex flex-col gap-6 p-4">
  <div class="flex items-center gap-3">
    <button onclick={handleBack} class="size-10 flex items-center justify-center rounded-m3-full bg-surface-variant text-on-surface-variant hover:bg-surface-container transition-colors">
      <span class="material-symbols-outlined">arrow_back</span>
    </button>
    <h1 class="text-2xl font-normal text-on-surface">Reviewer Manager</h1>
    <div class="ml-auto flex items-center gap-2">
      <span class="material-symbols-outlined text-sm text-on-surface-variant">volunteer_activism</span>
      <span class="text-sm text-on-surface-variant">Reviewer Manager</span>
    </div>
  </div>

  <div class="rounded-m3-xl bg-surface border border-outline-variant/30 overflow-x-auto">
    <table class="w-full border-collapse">
      <thead>
        <tr class="border-b border-outline-variant/30">
          <th class="px-4 py-3 text-left text-sm font-medium text-on-surface">Title</th>
          <th class="px-4 py-3 text-left text-sm font-medium text-on-surface">Course</th>
          <th class="px-4 py-3 text-left text-sm font-medium text-on-surface">Type</th>
          <th class="px-4 py-3 text-right text-sm font-medium text-on-surface">Size</th>
        </tr>
      </thead>
      <tbody>
        {#each reviewers as reviewer}
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
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <div class="flex gap-3">
    <Button variant="tonal" onclick={() => { uploadModalOpen = true; }}>
      <span class="material-symbols-outlined text-sm">cloud_upload</span>
      Upload Reviewer
    </Button>
    <Button variant="tonal" onclick={handleBack}>
      <span class="material-symbols-outlined text-sm">arrow_back</span>
      Back to My Roles
    </Button>
  </div>
</div>

<Modal isOpen={uploadModalOpen} title="Upload Reviewer">
  <form onsubmit={(e) => { e.preventDefault(); handleUploadReviewer(); }} class="flex flex-col gap-4">
    <label class="flex flex-col gap-1.5">
      <span class="text-sm font-medium text-on-surface-variant">Title</span>
      <input type="text" bind:value={newTitle} required class="h-14 w-full rounded-m3-sm border border-outline bg-surface px-4 text-base text-on-surface" />
    </label>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <label class="flex flex-col gap-1.5">
        <span class="text-sm font-medium text-on-surface-variant">Course Code</span>
        <input type="text" bind:value={newCourseCode} required class="h-14 w-full rounded-m3-sm border border-outline bg-surface px-4 text-base text-on-surface" />
      </label>
      <label class="flex flex-col gap-1.5">
        <span class="text-sm font-medium text-on-surface-variant">Tags (comma-separated)</span>
        <input type="text" bind:value={newTags} class="h-14 w-full rounded-m3-sm border border-outline bg-surface px-4 text-base text-on-surface" />
      </label>
    </div>
    <label class="flex flex-col gap-1.5">
      <span class="text-sm font-medium text-on-surface-variant">Description / Summary</span>
      <textarea bind:value={newDescription} rows="3" class="w-full rounded-m3-sm border border-outline bg-surface px-4 py-3 text-base text-on-surface resize-y"></textarea>
    </label>
    <p class="text-xs text-on-surface-variant">Mockup: the file itself is not uploaded; a demo PDF entry is created with a simulated file size.</p>
    <div class="flex justify-end gap-2">
      <Button variant="text" type="button" onclick={resetUploadForm}>Cancel</Button>
      <Button variant="primary" type="submit">Upload Reviewer</Button>
    </div>
  </form>
</Modal>