import { Braces, GitBranch, Languages, ShieldCheck } from "lucide-react";
import type { StudioNode } from "../../src/document";
import { EditorTooltip } from "./StudioInspectorControls";

const features = [
  { key: "validation", label: "Validation", icon: ShieldCheck },
  { key: "transforms", label: "Transforms", icon: Braces },
  { key: "localization", label: "Localization", icon: Languages },
  { key: "logic", label: "Logic", icon: GitBranch },
] as const;

function configuredFeatures(node: StudioNode): Readonly<Record<typeof features[number]["key"], string>> {
  const validators = "validators" in node ? node.validators ?? [] : [];
  const transforms = "transforms" in node ? node.transforms ?? [] : [];
  const reducers = node.kind === "field" ? node.reducers ?? [] : [];
  const localizedProps = Object.values(node.localizedProps ?? {}).filter((key) => key.trim().length > 0);
  const localizedMessages = validators.some(({ message }) => typeof message === "object" && message !== null
    && (Boolean(message.key?.trim()) || Object.keys(message.translations ?? {}).length > 0));
  const localization = [
    localizedProps.length > 0 ? "Translated text" : "",
    node.kind === "field" && node.format !== undefined ? "Regional value formatting" : "",
    localizedMessages ? "Translated validation messages" : "",
  ].filter(Boolean);
  const logic = [
    node.behavior?.when !== undefined ? "Conditional visibility" : "",
    node.behavior?.presentWhen !== undefined ? "Conditional structure" : "",
    node.behavior?.disabled !== undefined && node.behavior.disabled !== false ? "Disabled state" : "",
    node.kind === "field" && node.computed !== undefined ? "Unsupported computed value" : "",
    node.kind === "field" && Object.keys(node.derivedProps ?? {}).length > 0 ? "Derived properties" : "",
    node.kind === "wizard" && node.navigation?.guard !== undefined ? "Navigation condition" : "",
  ].filter(Boolean);
  return {
    validation: validators.length > 0 ? `${validators.length} validation ${validators.length === 1 ? "rule" : "rules"} configured` : "",
    transforms: [transforms.length > 0 ? `${transforms.length} ${transforms.length === 1 ? "transform" : "transforms"}` : "", reducers.length > 0 ? `${reducers.length} ${reducers.length === 1 ? "reducer" : "reducers"}` : ""].filter(Boolean).join(" · "),
    localization: localization.join(" · "),
    logic: logic.join(" · "),
  };
}

export function StudioDesignFeatures({ node }: { readonly node: StudioNode }) {
  const configured = configuredFeatures(node);
  const active = features.filter(({ key }) => configured[key]);
  if (active.length === 0) return null;
  return <div className="studio-design-features" role="group" aria-label="Configured features">
    {active.map(({ key, label, icon: Icon }) => <EditorTooltip key={key} label={`${label}: ${configured[key]}`}>
      <span className="studio-design-feature" data-feature={key} role="img" aria-label={`${label}: ${configured[key]}`} tabIndex={0}><Icon size={12} aria-hidden="true" /></span>
    </EditorTooltip>)}
  </div>;
}

export function StudioDesignLegend() {
  return <div className="studio-design-legend" role="group" aria-label="Design indicators">
    <span>Configured on this item</span>
    {features.map(({ key, label, icon: Icon }) => <span key={key} data-feature={key}><Icon size={12} aria-hidden="true" />{label}</span>)}
  </div>;
}
