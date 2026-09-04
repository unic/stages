import { useEffect } from "react";
import { EditorCanvas, EditorShell, EditorSidebar } from "./ui/editor-shell";
import useStagesStore from "./store";
import SidePanel from "./SidePanel";
import Workspace from "./Workspace";
import { StudioDocumentStartup } from "./v1/StudioDocumentStartup";

export default function StudioEditorPage({
  documentV1Enabled = process.env.NEXT_PUBLIC_STUDIO_DOCUMENT_V1 === "1",
}) {
  const isEditMode = useStagesStore((state) => state.isEditMode);
  const config = useStagesStore((state) => state.currentConfig);
  const fieldsets = useStagesStore((state) => state.fieldsets);
  const generalConfig = useStagesStore((state) => state.generalConfig);
  const value = useStagesStore((state) => state.data);

  useEffect(() => {
    useStagesStore.persist.rehydrate();
  }, []);

  const content = !isEditMode ? <Workspace /> : (
    <EditorShell>
      <EditorCanvas><Workspace /></EditorCanvas>
      <EditorSidebar><SidePanel /></EditorSidebar>
    </EditorShell>
  );

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
