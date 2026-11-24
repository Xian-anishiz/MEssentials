<script lang="ts">
  type Props = {
    label: string;
    value: string | number;
    highlight?: boolean;
  };

  let { label, value, highlight = false }: Props = $props();
</script>

<div class="rounded-m3-lg bg-surface-variant/60 p-3 sm:p-4 flex flex-col gap-1 border border-outline-variant/30">
  <span class="text-xs font-medium uppercase tracking-wide text-on-surface-variant">{label}</span>
  <span class={`text-xl sm:text-2xl font-medium leading-tight ${highlight ? 'text-error' : 'text-on-surface'}`}>{value}</span>
</div>
