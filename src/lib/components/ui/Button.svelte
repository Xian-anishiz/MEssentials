<script lang="ts">
  let { 
    variant = 'primary', 
    size = 'md', 
    class: className = '', 
    children, 
    ...props 
  }: {
    variant?: 'primary' | 'secondary' | 'error' | 'outlined' | 'tonal' | 'text';
    size?: 'sm' | 'md' | 'lg';
    class?: string;
    children?: import('svelte').Snippet;
    [key: string]: any;
  } = $props();

  const baseClasses = "rounded-m3-sm font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-38 disabled:cursor-not-allowed";
  
  const variantClasses: Record<string, string> = {
    primary: "bg-primary text-on-primary hover:brightness-110",
    secondary: "bg-secondary text-on-secondary hover:brightness-110",
    error: "bg-error text-on-error hover:brightness-110",
    outlined: "border border-outline text-on-surface bg-surface hover:bg-surface-variant/50",
    tonal: "bg-primary-container text-on-primary-container hover:brightness-95",
    text: "text-primary hover:bg-primary/10"
  };

  const sizeClasses: Record<string, string> = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-base"
  };
</script>

<button class={`${baseClasses} ${variantClasses[variant || 'primary']} ${sizeClasses[size || 'md']} ${className}`} {...props}>
  {@render children?.()}
</button>
