import { useEffect } from "react";
import { EditorCanvas, EditorShell, EditorSidebar } from "./ui/editor-shell";
import useStagesStore from "./store";
import SidePanel from "./SidePanel";
import Workspace from "./Workspace";

export default function StudioEditorPage() {
  const isEditMode = useStagesStore((state) => state.isEditMode);

  useEffect(() => {
    useStagesStore.persist.rehydrate();
  }, []);

  if (!isEditMode) return <Workspace />;

  return (
    <EditorShell>
      <EditorCanvas><Workspace /></EditorCanvas>
      <EditorSidebar><SidePanel /></EditorSidebar>
    </EditorShell>
  );
}
