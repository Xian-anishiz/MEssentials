<script lang="ts">
  import NavRail from './NavRail.svelte';
  import MobileHeader from './MobileHeader.svelte';
  import MobileNavDrawer from './MobileNavDrawer.svelte';

  type Props = {
    children?: import('svelte').Snippet;
  };

  let { children }: Props = $props();

  let isMobileMenuOpen = $state(false);
</script>

<div class="flex h-dvh bg-background overflow-hidden overscroll-none">
  <!-- Desktop Navigation Rail (hidden on mobile) -->
  <NavRail />

  <!-- Main Content Shell: flat and full-bleed on mobile, floating card on desktop -->
  <main class="flex-1 flex flex-col min-h-0 md:my-4 md:mx-4 md:rounded-m3-xl bg-surface overflow-hidden md:shadow-m3-1 md:border md:border-outline-variant/30">
    <!-- Mobile Header with hamburger, notifications and profile -->
    <MobileHeader onOpenMenu={() => isMobileMenuOpen = true} />

    <div class="flex-1 flex flex-col min-w-0 min-h-0 overflow-y-auto overscroll-contain">
      {@render children?.()}
    </div>
  </main>

  <!-- Mobile Hamburger Navigation Drawer -->
  <MobileNavDrawer isOpen={isMobileMenuOpen} onClose={() => isMobileMenuOpen = false} />
</div>
