<script lang="ts">
  let {
    label,
    value = $bindable(''),
    options,
    required = false
  }: {
    label: string,
    value?: string,
    options: string[],
    required?: boolean
  } = $props();
</script>

<div class="flex flex-col gap-1.5">
  <label class="contents">
    <span class="text-sm font-medium text-on-surface-variant">
      {label} {#if required}<span class="text-error">*</span>{/if}
    </span>
    <select
      bind:value
      class="h-14 w-full rounded-m3-sm border border-outline bg-surface px-4 text-base text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
    >
      <option value="" disabled selected>Select {label}</option>
      {#each options as option}
        <option value={option}>{option}</option>
      {/each}
    </select>
  </label>
</div>
