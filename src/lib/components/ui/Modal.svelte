<script lang="ts">
  let { 
    isOpen = false, 
    title, 
    children, 
    actions 
  }: {
    isOpen: boolean;
    title: string;
    children?: import('svelte').Snippet;
    actions?: import('svelte').Snippet;
  } = $props();
</script>

{#if isOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/32 p-4" role="presentation">
    <div role="dialog" aria-modal="true" aria-labelledby="dlg-title"
         class="w-full max-w-[560px] min-w-[280px] rounded-m3-xl bg-surface-container p-6 shadow-m3-2 animate-in fade-in zoom-in-95 duration-150">
      <h2 id="dlg-title" class="text-2xl text-on-surface font-normal">{title}</h2>
      <div class="mt-4 text-sm text-on-surface-variant">
        {@render children?.()}
      </div>
      <div class="mt-6 flex justify-end gap-2">
        {@render actions?.()}
      </div>
    </div>
  </div>
{/if}
