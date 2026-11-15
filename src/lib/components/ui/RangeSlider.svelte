<script lang="ts">
  let { 
    min = 0, 
    max = 300, 
    value = $bindable(300) 
  }: {
    min?: number;
    max?: number;
    value?: number;
  } = $props();
</script>

<div class="flex flex-col gap-2">
  <div class="flex justify-between text-sm text-on-surface-variant">
    <span>₱{min}</span>
    <span class="font-medium text-primary">₱{value}</span>
    <span>₱{max}</span>
  </div>
  <input 
    type="range" 
    {min} 
    {max} 
    bind:value 
    class="w-full accent-primary h-2 bg-surface-variant rounded-lg cursor-pointer"
  />
</div>
