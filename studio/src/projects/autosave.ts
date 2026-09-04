export const STUDIO_AUTOSAVE_DELAY_MS = 1_500;

export interface StudioAutosaveController {
  schedule(): void;
  flush(): Promise<void>;
  cancel(): void;
}

/** Coalesces edits while serializing repository writes in revision order. */
export function createStudioAutosave(
  save: () => Promise<void>,
  options: {
    readonly delayMs?: number;
    readonly setTimer?: (callback: () => void, delay: number) => ReturnType<typeof setTimeout>;
    readonly clearTimer?: (timer: ReturnType<typeof setTimeout>) => void;
  } = {},
): StudioAutosaveController {
  const delayMs = options.delayMs ?? STUDIO_AUTOSAVE_DELAY_MS;
  const setTimer = options.setTimer ?? setTimeout;
  const clearTimer = options.clearTimer ?? clearTimeout;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pending = false;
  let queue = Promise.resolve();

  const run = (): Promise<void> => {
    if (!pending) return queue;
    pending = false;
    if (timer !== undefined) clearTimer(timer);
    timer = undefined;
    queue = queue.then(save, save);
    return queue;
  };

  return {
    schedule() {
      pending = true;
      if (timer !== undefined) clearTimer(timer);
      timer = setTimer(() => { void run(); }, delayMs);
    },
    flush: run,
    cancel() {
      pending = false;
      if (timer !== undefined) clearTimer(timer);
      timer = undefined;
    },
  };
}
