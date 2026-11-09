import { MOCK_QUEUE, type QueueStatus } from '$mocks/queue';

export function createQueueState() {
  let queue = $state<QueueStatus>(MOCK_QUEUE);

  return {
    get queue() { return queue; },
    leaveQueue() {
      queue = {
        ...queue,
        inQueue: false,
        status: 'left',
        position: null,
        queueNumber: null
      };
    },
    joinQueue() {
      queue = {
        ...queue,
        inQueue: true,
        status: 'waiting',
        queueNumber: 121,
        position: 15,
        queueLength: 135
      };
    }
  };
}

export const queueState = createQueueState();
