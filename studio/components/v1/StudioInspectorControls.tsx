import { useState, type ReactNode } from "react";
import { Collapsible, ToggleGroup, Tooltip } from "radix-ui";
import { Mail, Phone, Link, LockKeyhole, Clock, SlidersHorizontal, AlignHorizontalJustifyCenter, AlignHorizontalJustifyEnd, AlignLeft, AlignHorizontalJustifyStart, ArrowLeftRight, CalendarDays, ChevronDown, CircleHelp, Columns3, Component, Folder, Hash, Heading, Layers, ListChecks, ListTree, MessageSquare, Minus, Monitor, PanelTop, Smartphone, SquareCheck, Tablet, TextCursorInput, type LucideIcon } from "lucide-react";
import type { StudioLayoutSpec, StudioBreakpoint, StudioAlignment, StudioWidth } from "../../src/registry";

const icons: Readonly<Record<string, LucideIcon>> = {
  text: TextCursorInput, textarea: AlignLeft, number: Hash, choice: ListChecks,
  email: Mail, tel: Phone, url: Link, password: LockKeyhole, time: Clock, range: SlidersHorizontal,
  checkbox: SquareCheck, date: CalendarDays, "block:heading": Heading,
  "block:divider": Minus, "block:help": CircleHelp, "block:message": MessageSquare,
  group: Folder, collection: ListTree, "variant-collection": ListTree,
  wizard: Layers, stage: PanelTop, variant: Layers, fragment: Component, form: PanelTop,
};


export function StudioItemIcon({ kind }: { readonly kind: string }) {
  const Icon = icons[kind] ?? Component;
  return <Icon size={15} aria-hidden="true" />;
}

export function InspectorSection({ title, icon: Icon, children, defaultOpen = true }: {
  readonly title: string; readonly icon: LucideIcon; readonly children: ReactNode; readonly defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return <Collapsible.Root open={open} onOpenChange={setOpen} className="studio-inspector-section">
    <Collapsible.Trigger className="studio-inspector-section__trigger">
      <Icon size={14} aria-hidden="true" /><span>{title}</span><ChevronDown size={13} aria-hidden="true" />
    </Collapsible.Trigger>
    <Collapsible.Content forceMount hidden={!open} className="studio-inspector-section__content">{children}</Collapsible.Content>
  </Collapsible.Root>;
}

export function EditorTooltip({ label, children }: { readonly label: string; readonly children: ReactNode }) {
  return <Tooltip.Provider delayDuration={350}><Tooltip.Root>
    <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
    <Tooltip.Portal><Tooltip.Content className="studio-editor-tooltip" sideOffset={6}>{label}<Tooltip.Arrow /></Tooltip.Content></Tooltip.Portal>
  </Tooltip.Root></Tooltip.Provider>;
}

const widths: readonly { value: StudioWidth; label: string; fraction: string }[] = [
  { value: "quarter", label: "Quarter", fraction: "¼" }, { value: "third", label: "Third", fraction: "⅓" },
  { value: "half", label: "Half", fraction: "½" }, { value: "two-thirds", label: "Two thirds", fraction: "⅔" },
  { value: "three-quarters", label: "Three quarters", fraction: "¾" }, { value: "full", label: "Full", fraction: "1" },
];
const devices = [{ value: "desktop", label: "Desktop", icon: Monitor }, { value: "tablet", label: "Tablet", icon: Tablet }, { value: "mobile", label: "Mobile", icon: Smartphone }] as const;
const alignments = [{ value: "start", label: "Start", icon: AlignHorizontalJustifyStart }, { value: "center", label: "Center", icon: AlignHorizontalJustifyCenter }, { value: "end", label: "End", icon: AlignHorizontalJustifyEnd }, { value: "stretch", label: "Stretch", icon: ArrowLeftRight }] as const;

export function StudioLayoutControl({ layout, onChange }: {
  readonly layout: StudioLayoutSpec;
  readonly onChange: (layout: StudioLayoutSpec, breakpoint: StudioBreakpoint, property: "width" | "columns" | "align") => void;
}) {
  const [breakpoint, setBreakpoint] = useState<StudioBreakpoint>("desktop");
  const update = (property: "width" | "columns" | "align", value: StudioWidth | StudioAlignment | number) => {
    onChange({ ...layout, [property]: { ...layout[property], [breakpoint]: value } }, breakpoint, property);
  };
  return <div className="studio-layout-control">
    <ToggleGroup.Root type="single" value={breakpoint} onValueChange={(value) => { if (value) setBreakpoint(value as StudioBreakpoint); }} className="studio-segmented studio-layout-devices" aria-label="Layout breakpoint">
      {devices.map(({ value, label, icon: Icon }) => <ToggleGroup.Item key={value} value={value} aria-label={label}><Icon size={14} aria-hidden="true" /><span>{label}</span></ToggleGroup.Item>)}
    </ToggleGroup.Root>
    <div className="studio-layout-control__row"><span>Width</span><ToggleGroup.Root type="single" className="studio-segmented" value={layout.width[breakpoint]} onValueChange={(value) => { if (value) update("width", value as StudioWidth); }} aria-label={`${breakpoint} width`}>
      {widths.map(({ value, label, fraction }) => <EditorTooltip key={value} label={`${label} width`}><ToggleGroup.Item value={value} aria-label={`${label} width`}>{fraction}</ToggleGroup.Item></EditorTooltip>)}
    </ToggleGroup.Root></div>
    <div className="studio-layout-control__row"><span><Columns3 size={13} aria-hidden="true" /> Columns</span><ToggleGroup.Root type="single" className="studio-segmented" value={String(layout.columns[breakpoint])} onValueChange={(value) => { if (value) update("columns", Number(value)); }} aria-label={`${breakpoint} columns`}>
      {[1, 2, 3, 4].map((value) => <ToggleGroup.Item key={value} value={String(value)} aria-label={`${value} ${value === 1 ? "column" : "columns"}`}>{value}</ToggleGroup.Item>)}
    </ToggleGroup.Root></div>
    <div className="studio-layout-control__row"><span>Alignment</span><ToggleGroup.Root type="single" className="studio-segmented" value={layout.align[breakpoint]} onValueChange={(value) => { if (value) update("align", value as StudioAlignment); }} aria-label={`${breakpoint} alignment`}>
      {alignments.map(({ value, label, icon: Icon }) => <EditorTooltip key={value} label={label}><ToggleGroup.Item value={value} aria-label={label}><Icon size={15} aria-hidden="true" /></ToggleGroup.Item></EditorTooltip>)}
    </ToggleGroup.Root></div>
    <p className="studio-layout-control__hint">Editing {breakpoint} only</p>
  </div>;
}
