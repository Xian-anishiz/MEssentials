<script lang="ts">
  import Modal from '$components/ui/Modal.svelte';
  import Button from '$components/ui/Button.svelte';
  import type { Reviewer } from '$mocks/reviewers';

  type Props = {
    isOpen?: boolean;
    reviewer: Reviewer | null;
    onClose: () => void;
  };

  let { isOpen = false, reviewer, onClose }: Props = $props();
</script>

<Modal {isOpen} title={reviewer?.title || 'Reviewer Preview'}>
  <div class="flex flex-col gap-4">
    <div class="flex items-center gap-2">
      <span class="rounded-m3-sm bg-primary-container px-2 py-0.5 text-xs font-medium text-on-primary-container">{reviewer?.courseCode}</span>
      <span class="text-xs text-on-surface-variant">{reviewer?.fileSize} • Published {reviewer?.publishedAt}</span>
    </div>
    <p class="text-sm text-on-surface">{reviewer?.description}</p>
    
    {#if reviewer && !reviewer.hasSelectableText}
      <div class="p-3 rounded-m3-sm bg-error-container/40 border border-error/30 text-on-error-container text-xs flex items-center gap-2">
        <span class="material-symbols-outlined text-[18px]">warning</span>
        <span>Scanned PDF (No selectable text detected). Manual summary provided below.</span>
      </div>
      {#if reviewer.manualSummary}
        <div class="p-3 rounded-m3-sm bg-surface-variant text-xs text-on-surface">
          <strong>Manual Summary:</strong> {reviewer.manualSummary}
        </div>
      {/if}
    {/if}

    <div class="aspect-[4/3] w-full rounded-m3-lg bg-surface-variant flex flex-col items-center justify-center border border-outline-variant/40">
      <span class="material-symbols-outlined text-[48px] text-primary">picture_as_pdf</span>
      <span class="text-sm font-medium text-on-surface mt-2">PDF Document Viewer Simulation</span>
      <span class="text-xs text-on-surface-variant mt-1">R2 Signed URL Secure Preview</span>
    </div>
  </div>
  {#snippet actions()}
    <Button variant="outlined" onclick={onClose}>Close</Button>
    <Button variant="primary" onclick={() => { alert('Downloading reviewer PDF...'); onClose(); }}>
      <span class="material-symbols-outlined text-[18px]">download</span>
      Download PDF
    </Button>
  {/snippet}
</Modal>
