<script lang="ts">
  import { authState } from '$stores/auth.svelte';
  import AdminStatCard from '$components/admin/AdminStatCard.svelte';
  import RoleBadge from '$components/admin/RoleBadge.svelte';
  import { storeState } from '$stores/store.svelte';
  import { borrowState } from '$stores/borrow.svelte';
  import { eventsState } from '$stores/events.svelte';
  import { reviewerState } from '$stores/reviewer.svelte';
  import { queueState } from '$stores/queue.svelte';
  import type { VolunteerRole } from '$mocks/volunteers';

  const roleLabels: Record<VolunteerRole, string> = {
    store_manager: 'Store Manager',
    kailangan_manager: 'Borrow Manager',
    megaral_manager: 'Reviewer Manager',
    medays_manager: 'Events Manager',
    registration_manager: 'Queue Manager',
  };

  const roleDescriptions: Record<VolunteerRole, string> = {
    store_manager: 'Manage products, pricing, and stock',
    kailangan_manager: 'Manage the borrowable catalog and its units',
    megaral_manager: 'Manage reviewer uploads and metadata',
    medays_manager: 'Manage ME Days events and registration forms',
    registration_manager: 'Manage queue sessions and advisers',
  };

  const roleIcons: Record<VolunteerRole, string> = {
    store_manager: 'shopping_cart',
    kailangan_manager: 'inventory_2',
    megaral_manager: 'book',
    medays_manager: 'calendar_today',
    registration_manager: 'badge',
  };

  const roleRoutes: Record<VolunteerRole, string> = {
    store_manager: '/volunteers/store',
    kailangan_manager: '/volunteers/borrow',
    megaral_manager: '/volunteers/reviewers',
    medays_manager: '/volunteers/events',
    registration_manager: '/volunteers/queue',
  };

  const roleTileClasses: Record<VolunteerRole, string> = {
    store_manager: 'bg-primary-container/30 text-primary',
    kailangan_manager: 'bg-secondary-container/30 text-secondary',
    megaral_manager: 'bg-green-100/30 text-green-700',
    medays_manager: 'bg-emerald-100/30 text-emerald-700',
    registration_manager: 'bg-red-100/30 text-red-700',
  };

  const roles = $derived(((authState.user.volunteerRoles ?? []) as VolunteerRole[]));

  const unitsAvailable = $derived(
    borrowState.borrowables.reduce((sum, b) => sum + b.units.filter(u => u.status === 'available').length, 0)
  );
  const unitsTotal = $derived(
    borrowState.borrowables.reduce((sum, b) => sum + b.units.length, 0)
  );

  const stats = $derived.by(() => {
    const cards: { label: string; value: string | number; icon?: string }[] = [];
    const roleSet = new Set(roles);
    if (roleSet.has('store_manager')) {
      cards.push({ label: 'Products Listed', value: storeState.products.length, icon: 'shopping_cart' });
    }
    if (roleSet.has('kailangan_manager')) {
      cards.push({ label: 'Units Available', value: `${unitsAvailable} / ${unitsTotal}`, icon: 'inventory_2' });
    }
    if (roleSet.has('megaral_manager')) {
      cards.push({ label: 'Reviewers Published', value: reviewerState.reviewers.length, icon: 'book' });
    }
    if (roleSet.has('medays_manager')) {
      cards.push({ label: 'Events Open for Registration', value: eventsState.availableEvents.length, icon: 'calendar_today' });
    }
    if (roleSet.has('registration_manager')) {
      cards.push({ label: 'Queue Status', value: queueState.queue.sessionOpen ? 'Open' : 'Closed', icon: 'badge' });
    }
    return cards;
  });
</script>

<svelte:head><title>My Roles — MEssentials</title></svelte:head>

<div class="flex flex-col gap-6 p-4">
  <!-- Welcome Section -->
  <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
    <div>
      <h1 class="text-2xl font-normal text-on-surface">My Roles</h1>
      <p class="text-sm text-on-surface-variant mt-1">Volunteer dashboard summary and quick statistics</p>
    </div>
  </div>

  {#if roles.length > 0}
    <!-- Assigned Roles Badges -->
    <div class="flex items-center flex-wrap gap-2">
      <span class="text-sm font-medium text-on-surface-variant">Volunteer roles:</span>
      {#each roles as role (role)}
        <RoleBadge {role} size="md" />
      {/each}
    </div>

    <!-- Stats Grid for Assigned Roles -->
    {#if stats.length > 0}
      <div class={`grid grid-cols-1 gap-4 ${stats.length >= 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2'}`}>
        {#each stats as stat (stat.label)}
          <AdminStatCard label={stat.label} value={stat.value} icon={stat.icon} />
        {/each}
      </div>
    {/if}

    <!-- Quick Links: Manager Areas -->
    <div class={`grid grid-cols-1 gap-4 ${roles.length >= 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2'}`}>
      {#each roles as role (role)}
        <a
          href={roleRoutes[role]}
          class="group p-5 rounded-m3-xl bg-surface border border-outline-variant/30 hover:border-primary/50 transition-colors"
        >
          <div class={`size-12 rounded-m3-lg flex items-center justify-center mb-3 ${roleTileClasses[role]}`}>
            <span class="material-symbols-outlined text-[28px]">{roleIcons[role]}</span>
          </div>
          <h3 class="font-medium text-on-surface">{roleLabels[role]}</h3>
          <p class="text-sm text-on-surface-variant mt-1">{roleDescriptions[role]}</p>
        </a>
      {/each}
    </div>
  {:else}
    <p class="text-on-surface-variant">No volunteer roles assigned.</p>
  {/if}
</div>
