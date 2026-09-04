import { useEffect } from "react";
import { EditorCanvas, EditorShell, EditorSidebar } from "./ui/editor-shell";
import useStagesStore from "./store";
import SidePanel from "./SidePanel";
import Workspace from "./Workspace";
import { StudioDocumentStartup } from "./v1/StudioDocumentStartup";
import { StudioV1Editor } from "./v1/StudioV1Editor";

export default function StudioEditorPage({
  documentV1Enabled = process.env.NEXT_PUBLIC_STUDIO_DOCUMENT_V1 === "1",
  projectRepository,
}) {
  const isEditMode = useStagesStore((state) => state.isEditMode);
  const config = useStagesStore((state) => state.currentConfig);
  const fieldsets = useStagesStore((state) => state.fieldsets);
  const generalConfig = useStagesStore((state) => state.generalConfig);
  const value = useStagesStore((state) => state.data);

  useEffect(() => {
    useStagesStore.persist.rehydrate();
  }, []);

  const legacyContent = !isEditMode ? <Workspace /> : (
    <EditorShell>
      <EditorCanvas><Workspace /></EditorCanvas>
      <EditorSidebar><SidePanel /></EditorSidebar>
    </EditorShell>
  );
  const content = documentV1Enabled ? <StudioV1Editor repository={projectRepository} /> : legacyContent;

  return (
    <StudioDocumentStartup
      enabled={documentV1Enabled}
      config={config}
      fieldsets={fieldsets}
      generalConfig={generalConfig}
      value={value}
    >
      {content}
    </StudioDocumentStartup>
  );
}
