<script lang="ts">
  let {
    label,
    value = $bindable(''),
    type = 'text',
    placeholder = '',
    required = false,
    readonly = false,
    oninput
  }: {
    label: string;
    value?: string | number;
    type?: string;
    placeholder?: string;
    required?: boolean;
    readonly?: boolean;
    oninput?: (val: string) => void;
  } = $props();
</script>

<div class="flex flex-col gap-1.5">
  <label class="contents">
    {#if label}
      <span class="text-sm font-medium text-on-surface-variant">
        {label} {#if required}<span class="text-error">*</span>{/if}
      </span>
    {/if}
    <input
      {type}
      {value}
      {placeholder}
      {readonly}
      aria-label={label ? undefined : 'Input field'}
      oninput={(e) => oninput?.(e.currentTarget.value)}
      class="h-12 px-4 rounded-m3-sm bg-surface-variant/40 border border-outline-variant text-on-surface text-base focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all disabled:opacity-50"
    />
  </label>
</div>
