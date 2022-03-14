import i18n from '../../../energyschweiz/ech-i18n';

const config = (locale) => {
  return {
    fields: () => {
      return [
        {
          id: 'internalExpenses',
          label: i18n.internalExpenses[locale],
          tooltip: i18n.internalExpenses.tooltip[locale],
          type: 'collection',
          isRequired: true,
          init: true,
          fields: [
            {
              id: 'date',
              placeholder: i18n.internalExpenses.date[locale],
              type: 'date',
            },
            {
              id: 'milestone',
              placeholder: i18n.internalExpenses.milestone[locale],
              type: 'text',
            },
            {
              id: 'workPackage',
              placeholder: i18n.internalExpenses.workPackage[locale],
              type: 'text',
            },
            {
              id: 'function',
              placeholder: i18n.internalExpenses.function[locale],
              type: 'text',
            },
            {
              id: 'hourlyRate',
              placeholder: i18n.internalExpenses.hourlyRate[locale],
              type: 'number',
            },
            {
              id: 'hourEffort',
              placeholder: i18n.internalExpenses.hourEffort[locale],
              type: 'number',
            },
            {
              id: 'costs',
              placeholder: i18n.internalExpenses.costs[locale],
              type: 'number',
              isDisabled: true,
              computedValue: (data, collection) => {
                let total = 0;
                if (collection.hourlyRate && collection.hourEffort) {
                  total = collection.hourlyRate * collection.hourEffort;
                }
                return total;
              },
            },
          ],
        },
        {
          id: 'otherExpenses',
          label: i18n.otherExpenses[locale],
          tooltip: i18n.otherExpenses.tooltip[locale],
          type: 'collection',
          isRequired: true,
          init: true,
          fields: [
            {
              id: 'date',
              placeholder: i18n.otherExpenses.date[locale],
              type: 'date',
            },
            {
              id: 'milestone',
              placeholder: i18n.otherExpenses.milestone[locale],
              type: 'text',
            },
            {
              id: 'workPackage',
              placeholder: i18n.otherExpenses.workPackage[locale],
              type: 'text',
            },
            {
              id: 'expenseType',
              placeholder: i18n.otherExpenses.expenseType[locale],
              type: 'select',
              options: [{ value: 'donation', text: 'Spende' }],
            },
            {
              id: 'derivation',
              placeholder: i18n.otherExpenses.derivation[locale],
              type: 'text',
            },
            {
              id: 'expenses',
              placeholder: i18n.otherExpenses.expenses[locale],
              type: 'number',
            },
          ],
        },
        {
          id: 'total',
          label: i18n.total[locale],
          tooltip: i18n.total.tooltip[locale],
          type: 'number',
          isDisabled: true,
          required: true,
          computedValue: (data, collection) => {
            let total = 0;
            if (data.internalExpenses) {
              data.internalExpenses.forEach((cost) => {
                if (cost.costs) total = total + Number(cost.costs);
              });
            }
            if (data.otherExpenses) {
              data.otherExpenses.forEach((cost) => {
                if (cost.expenses) total = total + Number(cost.expenses);
              });
            }
            return total;
          },
        },
      ];
    },
  };
};

export default config;
