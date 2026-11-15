<script lang="ts">
  interface Props {
    label: string;
    value: string | number;
    icon?: string;
    trend?: { value: number; label: string; up?: boolean };
    highlight?: boolean;
  }

  let { label, value, icon, trend, highlight = false }: Props = $props();
</script>

<div class="rounded-m3-xl bg-surface p-6 border border-outline-variant/30 flex flex-col gap-4">
  <div class="flex items-start justify-between">
    <div>
      <p class="text-sm font-medium text-on-surface-variant">{label}</p>
      <p class="text-3xl font-normal mt-1 text-on-surface {highlight ? 'text-error' : ''}">{value}</p>
    </div>
    {#if icon}
      <div class="size-12 rounded-m3-lg bg-primary-container/30 flex items-center justify-center text-primary">
        <span class="material-symbols-outlined text-[28px]">{icon}</span>
      </div>
    {/if}
  </div>

  {#if trend}
    <div class="flex items-center gap-1.5 text-sm">
      <span class="material-symbols-outlined text-[18px] {trend.up ? 'text-success' : 'text-error'}">
        {trend.up ? 'trending_up' : 'trending_down'}
      </span>
      <span class="font-medium {trend.up ? 'text-success' : 'text-error'}">{Math.abs(trend.value)}%</span>
      <span class="text-on-surface-variant">{trend.label}</span>
    </div>
  {/if}
</div>