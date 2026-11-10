<script lang="ts">
  import AdminStatCard from '$components/admin/AdminStatCard.svelte';
  import { MOCK_STUDENTS } from '$mocks/students';
  import { MOCK_VOLUNTEERS } from '$mocks/volunteers';
  import { MOCK_ADMINS } from '$mocks/admin';
  import { borrowState } from '$stores/borrow.svelte';
  import { eventsState } from '$stores/events.svelte';

  const activeStudents = $derived(MOCK_STUDENTS.filter(s => s.isActive && s.isEnrolled).length);
  const activeVolunteers = $derived(MOCK_VOLUNTEERS.filter(v => v.isActive).length);
  const activeAdmins = $derived(MOCK_ADMINS.filter(a => a.isActive).length);
  const activeLoans = $derived(borrowState.loans.filter(l => l.status === 'active').length);
  const overdueLoans = $derived(borrowState.loans.filter(l => l.status === 'overdue').length);
  const dueSoonLoans = $derived(borrowState.loans.filter(l => l.status === 'due_soon').length);
  const registeredEvents = $derived(eventsState.registeredEvents.length);
  const availableEvents = $derived(eventsState.availableEvents.length);
</script>

<svelte:head>
  <title>Admin Dashboard — MEssentials</title>
</svelte:head>

<div class="flex flex-col gap-6">
  <!-- Welcome Section -->
  <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
    <div>
      <h1 class="text-2xl font-normal text-on-surface">Admin Dashboard</h1>
      <p class="text-sm text-on-surface-variant mt-1">System overview and quick statistics</p>
    </div>
  </div>

  <!-- Stats Grid -->
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    <AdminStatCard
      label="Active Students"
      value={activeStudents}
      icon="people"
      trend={{ value: 12, label: 'vs last month', up: true }}
    />
    <AdminStatCard
      label="Active Volunteers"
      value={activeVolunteers}
      icon="volunteer_activism"
      trend={{ value: 3, label: 'vs last month', up: true }}
    />
    <AdminStatCard
      label="Active Admins"
      value={activeAdmins}
      icon="admin_panel_settings"
    />
    <AdminStatCard
      label="Open Loans"
      value={activeLoans}
      icon="library_books"
      highlight={overdueLoans > 0}
      trend={{ value: overdueLoans, label: `${overdueLoans} overdue, ${dueSoonLoans} due soon`, up: false }}
    />
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    <AdminStatCard
      label="Registered Events"
      value={registeredEvents}
      icon="event_available"
      trend={{ value: 2, label: 'this week', up: true }}
    />
    <AdminStatCard
      label="Available Events"
      value={availableEvents}
      icon="event_note"
    />
    <AdminStatCard
      label="Total Inventory Items"
      value={borrowState.borrowables.length}
      icon="inventory_2"
    />
    <AdminStatCard
      label="Total Reviewers"
      value={0}
      icon="menu_book"
    />
  </div>

  <!-- Quick Links -->
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
    <a href="/admin/usage-logs" class="group p-5 rounded-m3-xl bg-surface border border-outline-variant/30 hover:border-primary/50 transition-colors">
      <div class="size-12 rounded-m3-lg bg-primary-container/30 flex items-center justify-center text-primary mb-3">
        <span class="material-symbols-outlined text-[28px]">history</span>
      </div>
      <h3 class="font-medium text-on-surface">Usage Logs</h3>
      <p class="text-sm text-on-surface-variant mt-1">View service activity</p>
    </a>

    <a href="/admin/students" class="group p-5 rounded-m3-xl bg-surface border border-outline-variant/30 hover:border-primary/50 transition-colors">
      <div class="size-12 rounded-m3-lg bg-secondary-container/30 flex items-center justify-center text-secondary mb-3">
        <span class="material-symbols-outlined text-[28px]">people</span>
      </div>
      <h3 class="font-medium text-on-surface">Students</h3>
      <p class="text-sm text-on-surface-variant mt-1">Manage student accounts</p>
    </a>

    <a href="/admin/volunteers" class="group p-5 rounded-m3-xl bg-surface border border-outline-variant/30 hover:border-primary/50 transition-colors">
      <div class="size-12 rounded-m3-lg bg-green-100/30 flex items-center justify-center text-green-700 mb-3">
        <span class="material-symbols-outlined text-[28px]">volunteer_activism</span>
      </div>
      <h3 class="font-medium text-on-surface">Volunteers</h3>
      <p class="text-sm text-on-surface-variant mt-1">Grant/revoke roles</p>
    </a>

    <a href="/admin/admins" class="group p-5 rounded-m3-xl bg-surface border border-outline-variant/30 hover:border-primary/50 transition-colors">
      <div class="size-12 rounded-m3-lg bg-red-100/30 flex items-center justify-center text-red-700 mb-3">
        <span class="material-symbols-outlined text-[28px]">admin_panel_settings</span>
      </div>
      <h3 class="font-medium text-on-surface">Admins</h3>
      <p class="text-sm text-on-surface-variant mt-1">Manage admin accounts</p>
    </a>

    <a href="/store" class="group p-5 rounded-m3-xl bg-surface border border-outline-variant/30 hover:border-primary/50 transition-colors">
      <div class="size-12 rounded-m3-lg bg-primary-container/30 flex items-center justify-center text-primary mb-3">
        <span class="material-symbols-outlined text-[28px]">shopping_cart</span>
      </div>
      <h3 class="font-medium text-on-surface">Student View</h3>
      <p class="text-sm text-on-surface-variant mt-1">Switch to student dashboard</p>
    </a>
  </div>
</div>