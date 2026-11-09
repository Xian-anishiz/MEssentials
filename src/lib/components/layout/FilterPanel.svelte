<script lang="ts">
  type Props = {
    title?: string;
    onReset?: () => void;
    children?: import('svelte').Snippet;
  };

  let { title = "Filters", onReset, children }: Props = $props();
</script>

<aside class="hidden md:flex w-panel shrink-0 border-l border-outline-variant/40 flex-col bg-surface p-6 overflow-y-auto">
  <div class="flex items-center justify-between pb-4 mb-4 border-b border-outline-variant/40">
    <h2 class="text-xl font-medium text-on-surface">{title}</h2>
    {#if onReset}
      <button onclick={onReset} class="h-9 px-3 rounded-m3-sm border border-primary text-primary text-sm font-medium hover:bg-primary/10 transition-colors">
        Reset Filters
      </button>
    {/if}
  </div>

  <div class="flex-1 flex flex-col gap-6">
    {@render children?.()}
  </div>
</aside>
