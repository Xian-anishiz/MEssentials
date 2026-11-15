<script lang="ts">
  import Modal from '$components/ui/Modal.svelte';
  import Button from '$components/ui/Button.svelte';
  import TextField from '$components/ui/TextField.svelte';
  import type { EventItem } from '$mocks/events';
  import { eventsState } from '$stores/events.svelte';
  import { authState } from '$stores/auth.svelte';

  type Props = {
    isOpen?: boolean;
    event: EventItem | null;
    onClose: () => void;
  };

  let { isOpen = false, event, onClose }: Props = $props();

  const user = $derived(authState.user);
  let promptAnswers = $state<Record<string, string>>({});

  function handleAction() {
    if (!event) return;
    if (event.registered) {
      eventsState.unregisterEvent(event.id);
    } else {
      eventsState.registerEvent(event.id);
    }
    onClose();
  }
</script>

<Modal {isOpen} title={event?.name || 'Event Details'}>
  <div class="flex flex-col gap-4">
    <div class="flex items-center gap-2">
      <span class="rounded-m3-sm bg-secondary-container px-2 py-0.5 text-xs text-on-secondary-container">{event?.category}</span>
      <span class="text-xs text-on-surface-variant">{event?.startsAt} • {event?.location}</span>
    </div>

    <p class="text-sm text-on-surface">{event?.description}</p>

    <!-- Prefilled User Details -->
    <div class="grid grid-cols-2 gap-4 pt-2 border-t border-outline-variant/30">
      <TextField label="Student Name" value={`${user.firstName} ${user.lastName}`} readonly />
      <TextField label="Student Number" value={user.studentNumber} readonly />
    </div>

    <!-- Event Custom Prompts -->
    {#if event && event.prompts.length > 0 && !event.registered}
      <div class="flex flex-col gap-3 pt-2 border-t border-outline-variant/30">
        <h4 class="text-sm font-medium text-on-surface">Registration Questions</h4>
        {#each event.prompts as prompt}
          <TextField 
            label={prompt.prompt} 
            required={prompt.required}
            value={promptAnswers[prompt.id] || ''} 
            oninput={(val) => promptAnswers[prompt.id] = val}
            placeholder="Type your answer here..."
          />
        {/each}
      </div>
    {/if}
  </div>
  {#snippet actions()}
    <Button variant="text" onclick={onClose}>Close</Button>
    {#if event}
      {#if event.registered}
        <Button variant="error" onclick={handleAction}>Unregister</Button>
      {:else}
        <Button variant="primary" onclick={handleAction}>Sign Up</Button>
      {/if}
    {/if}
  {/snippet}
</Modal>
