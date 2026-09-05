import { useRef, useState } from "react";
import { Dialog } from "radix-ui";
import { CircleHelp, X } from "lucide-react";
import { Button } from "../ui/button";
import { studioHelpTopics } from "./studioHelpContent";

export function StudioHelp({ topic, compact = false }: { readonly topic?: string; readonly compact?: boolean }) {
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(topic ?? "Getting started");
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const matches = (text: string) => terms.every((term) => text.toLowerCase().includes(term));
  const results = studioHelpTopics.flatMap((entry) => {
    if (matches(entry.title)) return [entry];
    const fields = entry.fields.filter(([name, explanation]) => matches(`${entry.title} ${name} ${explanation}`));
    return fields.length > 0 ? [{ ...entry, fields }] : matches(entry.summary) ? [entry] : [];
  }).sort((left, right) => Number(matches(right.title)) - Number(matches(left.title)));
  const visible = terms.length > 0 ? results : studioHelpTopics.filter((entry) => entry.title === selected);
  return <Dialog.Root onOpenChange={(open) => { if (open) { setQuery(""); setSelected(topic ?? "Getting started"); } }}>
    <Dialog.Trigger asChild><Button type="button" variant="ghost" size={compact ? "icon" : "sm"} className={compact ? "studio-help-trigger" : undefined} aria-label={topic ? `Help: ${topic}` : "Studio help"}>
      <CircleHelp size={15} aria-hidden="true" />{!compact && "Help"}
    </Button></Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Overlay className="studio-help-overlay" />
      <Dialog.Content className="studio-help-dialog" onOpenAutoFocus={(event) => { event.preventDefault(); searchRef.current?.focus(); }}>
        <header className="studio-help-heading"><div><Dialog.Title>Studio help</Dialog.Title><Dialog.Description>Find out what a feature or setting does, at your own pace.</Dialog.Description></div>
          <Dialog.Close asChild><Button type="button" variant="ghost" size="icon" aria-label="Close help"><X size={18} aria-hidden="true" /></Button></Dialog.Close>
        </header>
        <label className="studio-help-search"><span>Search features and fields</span><input ref={searchRef} className="ui-input" type="search" placeholder="Try placeholder, validation, or saving…" value={query} onChange={(event) => setQuery(event.currentTarget.value)} /></label>
        <div className="studio-help-body">
          <nav aria-label="Help topics">{studioHelpTopics.map((entry) => <button type="button" key={entry.title} aria-current={terms.length === 0 && selected === entry.title ? "page" : undefined} onClick={() => { setSelected(entry.title); setQuery(""); }}>{entry.title}</button>)}</nav>
          <div className="studio-help-articles" key={terms.length > 0 ? "search" : selected}>
            {terms.length > 0 && <p role="status">{results.length === 0 ? "No matching help. Try a field label or choose a topic." : `${results.length} matching topics`}</p>}
            {visible.map((entry) => <article key={entry.title}><h3>{entry.title}</h3><p>{entry.summary}</p><dl>{entry.fields.map(([name, explanation]) => <div key={name}><dt>{name}</dt><dd>{explanation}</dd></div>)}</dl></article>)}
          </div>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
