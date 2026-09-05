import type { StudioNode } from "../../src/document";
import type { StudioBreakpoint, StudioWidth } from "../../src/registry";
import { StudioItemIcon } from "./StudioInspectorControls";

const sizes = [
  { label: "S", width: "quarter", name: "Quarter" },
  { label: "M", width: "half", name: "Half" },
  { label: "L", width: "full", name: "Full" },
] as const;

export function StudioCanvasChrome({ kind, path, breakpoint, width, onWidth }: {
  readonly kind: StudioNode["kind"];
  readonly path: string;
  readonly breakpoint: StudioBreakpoint;
  readonly width: StudioWidth;
  readonly onWidth?: (width: StudioWidth) => void;
}) {
  const type = kind === "block" ? "Content" : kind[0]!.toUpperCase() + kind.slice(1);
  return <>
    <span className="studio-canvas-identity" title={`${type} · ${path}`}>
      <StudioItemIcon kind={kind} /><code>{path}</code>
    </span>
    {onWidth && <div className="studio-canvas-widths" role="group" aria-label={`${path} ${breakpoint} width`}>
      {sizes.map((size) => <button key={size.width} type="button"
        aria-label={`${size.name} width for ${path} on ${breakpoint}`}
        aria-pressed={width === size.width}
        title={`${size.name} width · ${breakpoint} only`}
        onClick={(event) => { event.stopPropagation(); onWidth(size.width); }}
      >{size.label}</button>)}
    </div>}
  </>;
}
