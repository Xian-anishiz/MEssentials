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
    },
    setSessionOpen(open: boolean) {
      if (open) {
        queue = {
          ...queue,
          sessionOpen: true,
          nowServing: null,
          status: 'waiting',
          inQueue: true,
          queueLength: queue.queueLength + 1,
          queueNumber: queue.queueLength + 1,
          position: queue.queueLength + 1
        };
      } else {
        queue = {
          ...queue,
          sessionOpen: false,
          inQueue: false,
          status: 'left',
          position: null,
          queueNumber: null
        };
      }
    },
    advanceQueue() {
      if (!queue.sessionOpen) return;
      const serving = queue.nowServing !== null ? queue.nowServing + 1 : (queue.queueNumber ?? 1);
      queue = {
        ...queue,
        nowServing: serving,
        position: queue.position !== null && queue.position > 1 ? queue.position - 1 : queue.position,
        queueLength: Math.max(0, queue.queueLength - 1)
      };
    },
    updateQueueFields(fields: Partial<QueueStatus>) {
      queue = { ...queue, ...fields };
    }
  };
}

export const queueState = createQueueState();
