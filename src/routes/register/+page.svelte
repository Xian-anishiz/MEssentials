<script lang="ts">
  import Button from '$components/ui/Button.svelte';
  import Modal from '$components/ui/Modal.svelte';
  import { queueState } from '$stores/queue.svelte';

  const q = $derived(queueState.queue);
  let isLeaveModalOpen = $state(false);

  const inQueue = $derived(q.inQueue && q.position !== null);

  const peopleAhead = $derived(q.position !== null ? Math.max(q.position - 1, 0) : 0);
  const progressPercent = $derived(
    q.position !== null && q.queueLength > 0
      ? Math.min(100, Math.max(0, Math.round(((q.queueLength - q.position) / q.queueLength) * 100)))
      : 0
  );

  function handleLeaveConfirm() {
    queueState.leaveQueue();
    isLeaveModalOpen = false;
  }
</script>

<svelte:head>
  <title>Registration Queue — MEssentials</title>
</svelte:head>

<div class="flex flex-1 min-h-full justify-center p-4 md:p-6">
  <div class="w-full max-w-[640px] my-auto flex flex-col gap-4 sm:gap-6">
    <div class="flex flex-col gap-1">
      <h1 class="text-2xl sm:text-[28px] font-normal text-on-surface">
        {inQueue ? 'You are in line' : 'Registration Queue'}
      </h1>
      <p class="text-sm text-on-surface-variant break-words">{q.sessionName}</p>
      <p class="flex items-center gap-1 text-sm text-on-surface-variant">
        <span class="material-symbols-outlined text-[16px]">location_on</span>
        {q.location || 'Venue to be announced'}
      </p>
    </div>

    {#if inQueue}
      <!-- Position Card -->
      <div class="rounded-m3-lg bg-primary text-on-primary p-5 sm:p-8 flex flex-col items-center justify-center text-center shadow-m3-1">
        <span class="text-xs sm:text-sm font-medium uppercase tracking-wide text-on-primary/80">Your Position</span>
        <span class="text-[52px] leading-none font-normal my-3">{q.position}</span>
        <div class="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs sm:text-sm text-on-primary/90">
          <span>Ticket #{q.queueNumber ?? '—'}</span>
          <span class="opacity-60">•</span>
          <span>{q.queueLength} people in line</span>
          <span class="opacity-60">•</span>
          <span>Now serving {q.nowServing ?? '—'}</span>
        </div>

        <!-- Progress Bar -->
        <div class="w-full max-w-xs h-1 bg-white/30 rounded-full mt-5 overflow-hidden">
          <div class="h-full bg-white rounded-full transition-[width] duration-300" style={`width: ${progressPercent}%;`}></div>
        </div>
        <span class="text-xs text-on-primary/80 mt-2">
          {peopleAhead === 0 ? "You're next in line" : `${peopleAhead} ${peopleAhead === 1 ? 'person' : 'people'} ahead of you`}
        </span>
      </div>

      <!-- What happens next card -->
      <div class="rounded-m3-lg bg-primary-container p-4 sm:p-6 flex flex-col gap-3 sm:gap-4 text-on-primary-container">
        <h3 class="text-base font-medium">What happens next</h3>
        <ol class="flex flex-col gap-3 text-sm">
          <li class="flex items-start gap-3">
            <span class="size-7 sm:size-8 rounded-m3-md bg-surface text-primary flex items-center justify-center font-bold shadow-m3-1 shrink-0">1</span>
            <span class="pt-0.5">Wait for your queue number to be called for Advising &amp; Clearance.</span>
          </li>
          <li class="flex items-start gap-3">
            <span class="size-7 sm:size-8 rounded-m3-md bg-surface text-primary flex items-center justify-center font-bold shadow-m3-1 shrink-0">2</span>
            <span class="pt-0.5">Assigned Adviser: <strong>{q.adviserName || 'Not yet assigned'}</strong>{#if q.adviserDesk} ({q.adviserDesk}){/if}</span>
          </li>
          <li class="flex items-start gap-3">
            <span class="size-7 sm:size-8 rounded-m3-md bg-surface text-primary flex items-center justify-center font-bold shadow-m3-1 shrink-0">3</span>
            <span class="pt-0.5">Proceed to the desk immediately when notified.</span>
          </li>
        </ol>
      </div>

      <!-- Actions -->
      <div class="flex flex-col-reverse sm:grid sm:grid-cols-2 gap-3 sm:gap-4 pt-1">
        <Button variant="outlined" size="lg" onclick={() => isLeaveModalOpen = true}>Leave Queue</Button>
        <Button variant="primary" size="lg" onclick={() => alert('Proceeding to registration verification...')}>Continue</Button>
      </div>
    {:else}
      <!-- Not in queue -->
      <div class="rounded-m3-lg bg-surface border border-outline-variant/40 p-6 sm:p-8 flex flex-col items-center text-center gap-3">
        <span class="material-symbols-outlined text-[44px] text-outline-variant">event_seat</span>
        <p class="text-base font-medium text-on-surface">You're not in the queue</p>
        <p class="text-sm text-on-surface-variant max-w-sm">
          {q.sessionOpen
            ? 'Join the queue to get a ticket number and secure your place in line.'
            : 'The queue is currently closed. Please check back once the session opens.'}
        </p>
        <Button variant="primary" size="lg" disabled={!q.sessionOpen} onclick={() => queueState.joinQueue()} class="w-full sm:w-auto">
          <span class="material-symbols-outlined text-[18px]">login</span>
          Join Queue
        </Button>
      </div>
    {/if}
  </div>
</div>

<Modal isOpen={isLeaveModalOpen} title="Leave the queue?">
  <p class="text-on-surface">You will lose your place in line (Ticket #{q.queueNumber}). If you join again, you will receive a new ticket number at the back of the line.</p>
  {#snippet actions()}
    <Button variant="text" onclick={() => isLeaveModalOpen = false}>Cancel</Button>
    <Button variant="error" onclick={handleLeaveConfirm}>Leave Queue</Button>
  {/snippet}
</Modal>
