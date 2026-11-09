<script lang="ts">
  type Props = {
    selected?: boolean;
    onclick?: () => void;
    children?: import('svelte').Snippet;
  };

  let { selected = false, onclick, children }: Props = $props();
</script>

<button 
  type="button"
  class={`h-9 px-3 rounded-m3-sm text-sm font-medium transition-colors flex items-center justify-center ${selected ? 'bg-secondary-container text-on-secondary-container' : 'border border-primary text-primary hover:bg-primary/10'}`}
  {onclick}
>
  {@render children?.()}
</button>
