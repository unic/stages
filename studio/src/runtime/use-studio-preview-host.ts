import { useEffect, useLayoutEffect, useRef, useSyncExternalStore } from "react";
import type {
  StudioPreviewHost,
  StudioPreviewHostUpdate,
  UseStudioPreviewHostResult,
} from "./types";

export function useStudioPreviewHost(
  host: StudioPreviewHost,
  input: StudioPreviewHostUpdate,
): UseStudioPreviewHostResult {
  const lifecycleRef = useRef<Readonly<{ host: StudioPreviewHost; token: number }> | undefined>(undefined);
  const snapshot = useSyncExternalStore(host.subscribe, host.getSnapshot, host.getSnapshot);

  useLayoutEffect(() => {
    host.update(input);
  }, [host, input]);

  useEffect(() => {
    const lifecycle = { host, token: (lifecycleRef.current?.token ?? 0) + 1 };
    lifecycleRef.current = lifecycle;
    return () => {
      queueMicrotask(() => {
        const current = lifecycleRef.current;
        if (current?.host !== host || current.token === lifecycle.token) host.destroy();
      });
    };
  }, [host]);

  return { host, controller: host.controller, snapshot, diagnostics: host.getDiagnostics() };
}
