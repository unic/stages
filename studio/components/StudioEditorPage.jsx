import { useEffect } from "react";
import { EditorCanvas, EditorShell, EditorSidebar } from "./ui/editor-shell";
import useStagesStore from "./store";
import SidePanel from "./SidePanel";
import Workspace from "./Workspace";

export default function StudioEditorPage() {
  const store = useStagesStore();

  useEffect(() => {
    useStagesStore.persist.rehydrate();
  }, []);

  if (!store) return <div role="alert">The editor could not be loaded.</div>;
  if (!store.isEditMode) return <Workspace />;

  return (
    <EditorShell>
      <EditorCanvas><Workspace /></EditorCanvas>
      <EditorSidebar><SidePanel /></EditorSidebar>
    </EditorShell>
  );
}
