import type { StudioFormDocument, StudioFragmentDefinition, Uid } from "../document";
import { compileStudioForm } from "./compiler";
import type { CompiledStudioForm, StudioCompileOptions } from "./types";

const EMPTY_FRAGMENTS: Readonly<Record<Uid, StudioFragmentDefinition>> = Object.freeze({});

function documentKey(value: unknown): string {
  return JSON.stringify(value, (_key, child: unknown) => {
    if (child === null || typeof child !== "object" || Array.isArray(child)) return child;
    return Object.fromEntries(Object.entries(child).sort(([left], [right]) => left.localeCompare(right)));
  });
}

/** Exclude only inputs that the compiler consumes exclusively in the render plan. */
function runtimeDocument(form: StudioFormDocument): unknown {
  return {
    ...form,
    settings: Object.fromEntries(Object.entries(form.settings).filter(([key]) => key !== "theme")),
    nodes: Object.fromEntries(Object.entries(form.nodes).map(([uid, node]) => [uid,
      Object.fromEntries(Object.entries(node).filter(([key]) =>
        key !== "presentation" && !(node.kind === "block" && key === "props"))),
    ])),
  };
}

/** One owner's last compilation. Document inputs and binding registries must be immutable. */
export function createStudioCompilerSession() {
  let previous: {
    form: StudioFormDocument;
    fragments: Readonly<Record<Uid, StudioFragmentDefinition>>;
    options: StudioCompileOptions;
    key: string;
    runtimeKey: string;
    compiled: CompiledStudioForm;
  } | undefined;

  return {
    compile(
      form: StudioFormDocument,
      fragments: Readonly<Record<Uid, StudioFragmentDefinition>> = EMPTY_FRAGMENTS,
      options: StudioCompileOptions = {},
    ): CompiledStudioForm {
      const cached = previous;
      const sameBindings = cached !== undefined && cached.options.serviceBindings === options.serviceBindings && cached.options.customFields === options.customFields;
      if (sameBindings && cached.form === form && cached.fragments === fragments
        && cached.options.localization?.defaultLocale === options.localization?.defaultLocale
        && cached.options.localization?.resources === options.localization?.resources) return cached.compiled;

      // Functions belong to the trusted binding environment, compared by identity above.
      const key = documentKey({ form, fragments, localization: options.localization });
      const fresh = sameBindings && cached.key === key
        ? cached.compiled
        : compileStudioForm(form, fragments, options, sameBindings ? cached.compiled : undefined);
      const runtimeKey = documentKey({ form: runtimeDocument(fresh.expandedForm), localization: options.localization });
      // Keep the fresh render plan, source map, and diagnostics. An unchanged
      // runtime schema must not cancel validation through controller.update().
      const compiled = sameBindings && cached.runtimeKey === runtimeKey && fresh !== cached.compiled
        ? { ...fresh, schema: cached.compiled.schema, schemaInput: cached.compiled.schemaInput }
        : fresh;
      previous = { form, fragments, options, key, runtimeKey, compiled };
      return compiled;
    },
  };
}
