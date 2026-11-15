<script lang="ts">
  import Button from '$components/ui/Button.svelte';
  import Modal from '$components/ui/Modal.svelte';
  import { queueState } from '$stores/queue.svelte';

  const q = $derived(queueState.queue);
  let isLeaveModalOpen = $state(false);

  function handleLeaveConfirm() {
    queueState.leaveQueue();
    isLeaveModalOpen = false;
  }
</script>

<svelte:head>
  <title>Registration Queue — MEssentials</title>
</svelte:head>

<div class="flex flex-1 min-h-full items-center justify-center p-4 md:p-6">
  <div class="w-full max-w-[640px] flex flex-col gap-6 bg-surface p-8 rounded-m3-xl shadow-m3-1 border border-outline-variant/30">
    <div class="flex flex-col gap-1">
      <h1 class="text-[28px] font-normal text-on-surface">You are in line</h1>
      <p class="text-sm text-on-surface-variant">{q.sessionName} • Venue: {q.location}</p>
    </div>

    <!-- Position Card -->
    <div class="rounded-m3-lg bg-primary text-on-primary p-8 flex flex-col items-center justify-center text-center shadow-m3-1">
      <span class="text-lg font-medium tracking-[0.15px] text-on-primary/80">Your Position</span>
      <span class="text-[57px] leading-[64px] font-normal my-2">{q.position || '—'}</span>
      <span class="text-sm text-on-primary/90">Ticket #{q.queueNumber} • {q.queueLength} people in line</span>
      
      <!-- Progress Bar -->
      <div class="w-full max-w-xs h-1 bg-white/30 rounded-full mt-6 overflow-hidden">
        <div class="h-full bg-white rounded-full" style="width: 45%;"></div>
      </div>
    </div>

    <!-- What happens next card -->
    <div class="rounded-m3-lg bg-primary-container p-6 flex flex-col gap-4 text-on-primary-container">
      <h3 class="text-base font-medium">What happens next</h3>
      <ol class="flex flex-col gap-3 text-sm">
        <li class="flex items-center gap-3">
          <span class="size-8 rounded-m3-md bg-surface text-primary flex items-center justify-center font-bold shadow-m3-1 shrink-0">1</span>
          <span>Wait for your queue number to be called for Advising & Clearance.</span>
        </li>
        <li class="flex items-center gap-3">
          <span class="size-8 rounded-m3-md bg-surface text-primary flex items-center justify-center font-bold shadow-m3-1 shrink-0">2</span>
          <span>Assigned Adviser: <strong>{q.adviserName || 'Not yet assigned'}</strong> ({q.adviserDesk})</span>
        </li>
        <li class="flex items-center gap-3">
          <span class="size-8 rounded-m3-md bg-surface text-primary flex items-center justify-center font-bold shadow-m3-1 shrink-0">3</span>
          <span>Proceed to desk immediately when notified.</span>
        </li>
      </ol>
    </div>

    <!-- Actions -->
    <div class="grid grid-cols-2 gap-4 pt-2">
      <Button variant="outlined" size="lg" onclick={() => isLeaveModalOpen = true}>Leave Queue</Button>
      <Button variant="primary" size="lg" onclick={() => alert('Proceeding to registration verification...')}>Continue</Button>
    </div>
  </div>
</div>

<Modal isOpen={isLeaveModalOpen} title="Leave the queue?">
  <p class="text-on-surface">You will lose your place in line (Ticket #{q.queueNumber}). You cannot rejoin the same session without manager assistance.</p>
  {#snippet actions()}
    <Button variant="text" onclick={() => isLeaveModalOpen = false}>Cancel</Button>
    <Button variant="error" onclick={handleLeaveConfirm}>Leave Queue</Button>
  {/snippet}
</Modal>
