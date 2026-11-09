<script lang="ts">
  type Props = {
    variant?: 'secondary' | 'error' | 'success' | 'primary';
    children?: import('svelte').Snippet;
  };

  let { variant = 'secondary', children }: Props = $props();

  const variants = {
    secondary: "bg-secondary text-on-secondary",
    error: "bg-error-container text-on-error-container",
    success: "bg-primary-container text-on-primary-container",
    primary: "bg-secondary-container text-on-secondary-container"
  };
</script>

<span class={`inline-flex items-center px-2.5 py-0.5 rounded-m3-sm text-xs font-medium ${variants[variant]}`}>
  {@render children?.()}
</span>
