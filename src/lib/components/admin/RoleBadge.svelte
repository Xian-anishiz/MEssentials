<script lang="ts">
  type VolunteerRole = 'store_manager' | 'kailangan_manager' | 'megaral_manager' | 'medays_manager' | 'registration_manager';

  interface Props {
    role: VolunteerRole;
    size?: 'sm' | 'md';
  }

  let { role, size = 'md' }: Props = $props();

  // Fallback color classes for M3 tokens that may not be defined
  const roleColors: Record<VolunteerRole, string> = {
    store_manager: 'bg-primary-container text-on-primary-container',
    kailangan_manager: 'bg-secondary-container text-on-secondary-container',
    megaral_manager: 'bg-green-100 text-green-900',
    medays_manager: 'bg-emerald-100 text-emerald-900',
    registration_manager: 'bg-red-100 text-red-900',
  };

  // Label mapping
  const roleLabels: Record<VolunteerRole, string> = {
    store_manager: 'Store Manager',
    kailangan_manager: 'Borrow Manager',
    megaral_manager: 'Reviewer Manager',
    medays_manager: 'Events Manager',
    registration_manager: 'Queue Manager',
  };
</script>

<span class={`inline-flex items-center ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-0.5 text-xs'} rounded-m3-sm font-medium ${roleColors[role] ?? 'bg-secondary-container text-on-secondary-container'}`}>
  {roleLabels[role] ?? role}
</span>