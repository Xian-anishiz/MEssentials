<script lang="ts">
  let { 
    value = $bindable(''), 
    placeholder = "Search...", 
    oninput 
  }: {
    value?: string;
    placeholder?: string;
    oninput?: (val: string) => void;
  } = $props();
</script>

<div class="relative w-full">
  <input 
    type="text" 
    bind:value 
    oninput={(e) => oninput?.(e.currentTarget.value)}
    {placeholder}
    class="w-full h-14 rounded-m3-full bg-primary-container/60 text-on-primary-container px-6 pr-12 text-base placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-primary border border-transparent"
  />
  <span class="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant">search</span>
</div>
