import { cn } from "../../lib/utils";

export function EditorShell({ children, className }) {
  return <div className={cn("studio-shell", className)}>{children}</div>;
}

export function EditorCanvas({ children, className }) {
  return <main className={cn("studio-shell__canvas", className)}>{children}</main>;
}

export function EditorSidebar({ children, className }) {
  return <aside className={cn("studio-shell__sidebar", className)}>{children}</aside>;
}
