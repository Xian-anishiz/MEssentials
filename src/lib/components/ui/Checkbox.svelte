<script lang="ts">
  let { 
    checked = $bindable(false), 
    label, 
    count, 
    onchange 
  }: {
    checked?: boolean;
    label: string;
    count?: number;
    onchange?: (checked: boolean) => void;
  } = $props();
</script>

<label class="flex items-center justify-between py-1.5 cursor-pointer group">
  <div class="flex items-center gap-3">
    <input 
      type="checkbox" 
      bind:checked 
      onchange={(e) => onchange?.(e.currentTarget.checked)}
      class="size-4 rounded-m3-xs accent-primary border-outline text-primary focus:ring-primary cursor-pointer" 
    />
    <span class="text-base text-on-surface group-hover:text-primary transition-colors">{label}</span>
  </div>
  {#if count !== undefined}
    <span class="rounded-m3-sm bg-secondary-container px-2 py-0.5 text-xs text-on-secondary-container font-medium">{count}</span>
  {/if}
</label>
