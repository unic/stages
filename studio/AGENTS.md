# Studio guidance

Studio is a v1 consumer with a deliberate 0.x configuration converter.

- Do not bypass the converter by importing root 0.x runtime code.
- Preserve converter immutability, diagnostics, and presentation-key behavior.
- Run `npm --prefix studio run test:v1` for component, store, or converter changes.
- Also run `npm --prefix studio run build` for routing, Next.js integration, or configuration changes.
