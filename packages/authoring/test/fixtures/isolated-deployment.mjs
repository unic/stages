import { readFileSync } from 'node:fs';
export { validatePortableSubmission } from '../../dist/index.js';
const definition = JSON.parse(readFileSync(new URL('./contact-form-v1.json', import.meta.url)));
definition.form.nodes.name.validators = [{ kind: 'pattern', pattern: '^(a+)+$', message: 'Pattern' }];
export const deployment = { definition, revision: 'isolated-pattern-v1' };
