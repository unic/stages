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

/** One owner's last compilation. Document inputs and binding registries must be immutable. */
export function createStudioCompilerSession() {
  let previous: {
    form: StudioFormDocument;
    fragments: Readonly<Record<Uid, StudioFragmentDefinition>>;
    options: StudioCompileOptions;
    key: string;
    compiled: CompiledStudioForm;
  } | undefined;

  return {
    compile(
      form: StudioFormDocument,
      fragments: Readonly<Record<Uid, StudioFragmentDefinition>> = EMPTY_FRAGMENTS,
      options: StudioCompileOptions = {},
    ): CompiledStudioForm {
      const cached = previous;
      const sameBindings = cached !== undefined && cached.options.serviceBindings === options.serviceBindings;
      if (sameBindings && cached.form === form && cached.fragments === fragments
        && cached.options.localization?.defaultLocale === options.localization?.defaultLocale
        && cached.options.localization?.resources === options.localization?.resources) return cached.compiled;

      // Functions belong to the trusted binding environment, compared by identity above.
      const key = documentKey({ form, fragments, localization: options.localization });
      const compiled = sameBindings && cached.key === key
        ? cached.compiled
        : compileStudioForm(form, fragments, options, sameBindings ? cached.compiled : undefined);
      previous = { form, fragments, options, key, compiled };
      return compiled;
    },
  };
}
