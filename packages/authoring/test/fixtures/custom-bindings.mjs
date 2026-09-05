// The same trusted implementation is used in workspace and isolated consumers.
export function customBindings({ definePortableFieldBindings, definePortableBehaviorBindings, matchesPortableValue }, descriptors) {
  const fieldBindings = definePortableFieldBindings(descriptors.map(descriptor => ({
    key: descriptor.key, version: descriptor.version,
    field: {
      reduce: ({ event }) => {
        if (event.name !== 'input') return;
        let value = event.payload;
        if (descriptor.key === 'example/optional-number' && typeof value === 'string') {
          if (value.trim() === '') value = null;
          else if (/^-?(?:\d+\.?\d*|\.\d+)$/.test(value)) value = Number(value);
          else return;
        }
        if (!matchesPortableValue(descriptor.value, value)) return;
        return { value };
      },
      ...(descriptor.key === 'example/money' ? { validators: [{ id: 'safe-minor-units', validate: value => Number.isSafeInteger(value.minorUnits) ? [] : [{ id: 'money.precision', code: 'money.precision', severity: 'error', message: 'Use integer minor units.' }] }] } : {}),
    },
  })));
  const behaviorBindings = definePortableBehaviorBindings([{
    key: 'example/policy', version: 1,
    configure(config) {
      if (typeof config.maximum !== 'number') throw new Error('maximum must be numeric');
      return {
        validators: [{ id: 'budget', on: 'submit', dependencies: [['money']], validate: async ({ value, signal }) => {
          await Promise.resolve();
          if (signal.aborted) return [];
          return value.money.minorUnits > config.maximum ? [{ id: 'budget', code: 'budget', severity: 'error', path: ['money'], message: 'Budget exceeded.' }] : [];
        } }],
        transforms: [{ on: 'normalize', apply: ({ value }) => [{ op: 'set', path: ['person'], value: { given: value.person.given.trim(), family: value.person.family.trim() } }] }],
      };
    },
  }]);
  return { fieldBindings, behaviorBindings };
}
