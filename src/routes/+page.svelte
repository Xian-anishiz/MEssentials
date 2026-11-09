<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  onMount(() => {
    goto('/store');
  });
</script>

<div class="flex items-center justify-center h-full">
  <p class="text-on-surface-variant">Redirecting to MEssentials Store...</p>
</div>
