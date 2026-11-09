<script lang="ts">
  type Props = {
    isOpen?: boolean;
    title?: string;
    onClose: () => void;
    onReset?: () => void;
    children?: import('svelte').Snippet;
  };

  let { 
    isOpen = false, 
    title = "Filters", 
    onClose, 
    onReset, 
    children 
  }: Props = $props();
</script>

{#if isOpen}
  <div class="fixed inset-0 z-50 flex md:hidden" role="presentation">
    <button
      aria-label="Close filters"
      class="absolute inset-0 bg-black/40 cursor-default"
      onclick={onClose}
    ></button>
    <div class="relative w-[320px] max-w-full bg-surface h-full ml-auto flex flex-col p-6 shadow-m3-2 overflow-y-auto z-10" role="dialog" aria-modal="true" tabindex="-1">
      <div class="flex items-center justify-between pb-4 mb-4 border-b border-outline-variant/40">
        <h2 class="text-xl font-medium text-on-surface">{title}</h2>
        <div class="flex items-center gap-2">
          {#if onReset}
            <button onclick={onReset} class="text-xs text-primary font-medium px-2 py-1">Reset</button>
          {/if}
          <button onclick={onClose} class="size-9 rounded-m3-full flex items-center justify-center hover:bg-surface-variant">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
      </div>
      <div class="flex-1 flex flex-col gap-6">
        {@render children?.()}
      </div>
    </div>
  </div>
{/if}
