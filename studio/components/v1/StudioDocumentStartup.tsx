import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { StudioProjectDocument } from "../../src/document/types";
import { importLegacyStudioProject } from "../../src/legacy/importer";
import type { LegacyImportDiagnostic } from "../../src/legacy/types";
import shadcnFields from "../shadcnFields";

export const STUDIO_SUPPORTED_DEFINITIONS: Readonly<Record<string, readonly number[]>> = Object.freeze(Object.fromEntries([
  ...Object.keys(shadcnFields),
  "block:divider",
  "block:heading",
  "block:message",
].map((key) => [key, Object.freeze([1])])));

export interface StudioDocumentStartupValue {
  readonly mode: "document-v1" | "legacy";
  readonly project?: StudioProjectDocument;
  readonly diagnostics: readonly LegacyImportDiagnostic[];
}

const legacyValue: StudioDocumentStartupValue = Object.freeze({ mode: "legacy", diagnostics: [] });
const StudioDocumentContext = createContext<StudioDocumentStartupValue>(legacyValue);

export interface StudioDocumentStartupProps {
  readonly children: ReactNode;
  readonly enabled: boolean;
  readonly config: unknown;
  readonly fieldsets: unknown;
  readonly generalConfig: unknown;
  readonly value: unknown;
}

export function useStudioDocumentStartup(): StudioDocumentStartupValue {
  return useContext(StudioDocumentContext);
}

function StudioDocumentStartupBoundary({ children }: { readonly children: ReactNode }) {
  const startup = useStudioDocumentStartup();
  return (
    <div
      data-studio-startup={startup.mode}
      data-studio-project-format={startup.project?.format}
      data-studio-import-errors={startup.diagnostics.filter(({ severity }) => severity === "error").length}
      style={{ display: "contents" }}
    >
      {children}
    </div>
  );
}

export function StudioDocumentStartup({
  children,
  enabled,
  config,
  fieldsets,
  generalConfig,
  value,
}: StudioDocumentStartupProps) {
  const startup = useMemo<StudioDocumentStartupValue>(() => {
    if (!enabled) return legacyValue;
    const imported = importLegacyStudioProject(
      { config, fieldsets, generalConfig, value },
      { fieldTypes: Object.keys(shadcnFields) },
    );
    return imported.ok
      ? { mode: "document-v1", project: imported.value, diagnostics: imported.diagnostics }
      : { mode: "document-v1", diagnostics: imported.diagnostics };
  }, [config, enabled, fieldsets, generalConfig, value]);

  return (
    <StudioDocumentContext.Provider value={startup}>
      <StudioDocumentStartupBoundary>
        {children}
      </StudioDocumentStartupBoundary>
    </StudioDocumentContext.Provider>
  );
}
