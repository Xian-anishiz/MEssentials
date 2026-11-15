<script lang="ts">
  type Props = {
    label: string;
    value: string | number;
    highlight?: boolean;
  };

  let { label, value, highlight = false }: Props = $props();
</script>

<div class="rounded-m3-lg bg-surface-variant p-6 flex flex-col justify-between border border-outline-variant/30">
  <span class="text-lg font-medium text-on-surface">{label}</span>
  <span class={`text-5xl font-normal mt-4 ${highlight ? 'text-error' : 'text-on-surface'}`}>{value}</span>
</div>
