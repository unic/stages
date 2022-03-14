import i18n from '../../../energyschweiz/ech-i18n';

const config = (locale) => {
  return {
    fields: () => {
      return [
        {
          id: 'projectIncome',
          label: i18n.projectIncome[locale],
          type: 'collection',
          isRequired: false,
          init: true,
          min: 1,
          max: 1,
          fields: [
            {
              id: 'firstYear',
              label: i18n.projectIncome.firstYear[locale],
              type: 'number',
              isRequired: false,
            },
            {
              id: 'secondYear',
              label: i18n.projectIncome.secondYear[locale],
              type: 'number',
              isRequired: false,
            },
            {
              id: 'thirdYear',
              label: i18n.projectIncome.thirdYear[locale],
              type: 'number',
              isRequired: false,
            },
            {
              id: 'fourthYear',
              label: i18n.projectIncome.fourthYear[locale],
              type: 'number',
              isRequired: false,
            },
            {
              id: 'total',
              label: i18n.projectIncome.total[locale],
              type: 'number',
              isRequired: false,
              isDisabled: true,
              computedValue: (data, itemData) => {
                let result = 0;
                if (itemData.firstYear)
                  result = result + Number(itemData.firstYear);
                if (itemData.secondYear)
                  result = result + Number(itemData.secondYear);
                if (itemData.thirdYear)
                  result = result + Number(itemData.thirdYear);
                if (itemData.fourthYear)
                  result = result + Number(itemData.fourthYear);
                return result !== 0 ? result : '';
              },
            },
          ],
        },
        {
          id: 'echSubvention',
          label: i18n.echSubvention[locale],
          type: 'collection',
          isRequired: false,
          init: true,
          min: 1,
          max: 1,
          fields: [
            {
              id: 'firstYear',
              label: i18n.echSubvention.firstYear[locale],
              type: 'number',
              isRequired: false,
            },
            {
              id: 'secondYear',
              label: i18n.echSubvention.secondYear[locale],
              type: 'number',
              isRequired: false,
            },
            {
              id: 'thirdYear',
              label: i18n.echSubvention.thirdYear[locale],
              type: 'number',
              isRequired: false,
            },
            {
              id: 'fourthYear',
              label: i18n.echSubvention.fourthYear[locale],
              type: 'number',
              isRequired: false,
            },
            {
              id: 'percentageOfTotalCosts',
              label: i18n.echSubvention.percentageOfTotalCosts[locale],
              type: 'number',
              isRequired: false,
              isDisabled: true,
            },
            {
              id: 'total',
              label: i18n.echSubvention.total[locale],
              type: 'number',
              isRequired: false,
              isDisabled: true,
              computedValue: (data, itemData) => {
                let result = 0;
                if (itemData.firstYear)
                  result = result + Number(itemData.firstYear);
                if (itemData.secondYear)
                  result = result + Number(itemData.secondYear);
                if (itemData.thirdYear)
                  result = result + Number(itemData.thirdYear);
                if (itemData.fourthYear)
                  result = result + Number(itemData.fourthYear);
                return result !== 0 ? result : '';
              },
            },
          ],
        },
        {
          id: 'governmentFunding',
          label: i18n.governmentFunding[locale],
          type: 'collection',
          isRequired: false,
          init: true,
          min: 1,
          max: 1,
          fields: [
            {
              id: 'firstYear',
              label: i18n.governmentFunding.firstYear[locale],
              type: 'number',
              isRequired: false,
            },
            {
              id: 'secondYear',
              label: i18n.governmentFunding.secondYear[locale],
              type: 'number',
              isRequired: false,
            },
            {
              id: 'thirdYear',
              label: i18n.governmentFunding.thirdYear[locale],
              type: 'number',
              isRequired: false,
            },
            {
              id: 'fourthYear',
              label: i18n.governmentFunding.fourthYear[locale],
              type: 'number',
              isRequired: false,
            },
            {
              id: 'origin',
              label: i18n.governmentFunding.origin[locale],
              type: 'text',
              isRequired: false,
            },
            {
              id: 'total',
              label: i18n.governmentFunding.total[locale],
              type: 'number',
              isRequired: false,
              isDisabled: true,
              computedValue: (data, itemData) => {
                let result = 0;
                if (itemData.firstYear)
                  result = result + Number(itemData.firstYear);
                if (itemData.secondYear)
                  result = result + Number(itemData.secondYear);
                if (itemData.thirdYear)
                  result = result + Number(itemData.thirdYear);
                if (itemData.fourthYear)
                  result = result + Number(itemData.fourthYear);
                return result !== 0 ? result : '';
              },
            },
          ],
        },
        {
          id: 'furtherFundings',
          label: i18n.furtherFundings[locale],
          type: 'collection',
          isRequired: false,
          init: true,
          fields: [
            {
              id: 'firstYear',
              label: i18n.furtherFundings.firstYear[locale],
              type: 'number',
              isRequired: false,
            },
            {
              id: 'secondYear',
              label: i18n.furtherFundings.secondYear[locale],
              type: 'number',
              isRequired: false,
            },
            {
              id: 'thirdYear',
              label: i18n.furtherFundings.thirdYear[locale],
              type: 'number',
              isRequired: false,
            },
            {
              id: 'fourthYear',
              label: i18n.furtherFundings.fourthYear[locale],
              type: 'number',
              isRequired: false,
            },
            {
              id: 'origin',
              label: i18n.furtherFundings.origin[locale],
              type: 'number',
              isRequired: false,
            },
            {
              id: 'total',
              label: i18n.furtherFundings.total[locale],
              type: 'number',
              isRequired: false,
              isDisabled: true,
              computedValue: (data, itemData) => {
                let result = 0;
                if (itemData.firstYear)
                  result = result + Number(itemData.firstYear);
                if (itemData.secondYear)
                  result = result + Number(itemData.secondYear);
                if (itemData.thirdYear)
                  result = result + Number(itemData.thirdYear);
                if (itemData.fourthYear)
                  result = result + Number(itemData.fourthYear);
                return result !== 0 ? result : '';
              },
            },
          ],
        },
        {
          id: 'ownResources',
          label: i18n.ownResources[locale],
          type: 'collection',
          isRequired: false,
          init: true,
          min: 1,
          max: 1,
          fields: [
            {
              id: 'firstYear',
              label: i18n.ownResources.firstYear[locale],
              type: 'number',
              isRequired: false,
            },
            {
              id: 'secondYear',
              label: i18n.ownResources.secondYear[locale],
              type: 'number',
              isRequired: false,
            },
            {
              id: 'thirdYear',
              label: i18n.ownResources.thirdYear[locale],
              type: 'number',
              isRequired: false,
            },
            {
              id: 'fourthYear',
              label: i18n.ownResources.fourthYear[locale],
              type: 'number',
              isRequired: false,
            },
            {
              id: 'total',
              label: i18n.ownResources.total[locale],
              type: 'number',
              isRequired: false,
              isDisabled: true,
              computedValue: (data, itemData) => {
                let result = 0;
                if (itemData.firstYear)
                  result = result + Number(itemData.firstYear);
                if (itemData.secondYear)
                  result = result + Number(itemData.secondYear);
                if (itemData.thirdYear)
                  result = result + Number(itemData.thirdYear);
                if (itemData.fourthYear)
                  result = result + Number(itemData.fourthYear);
                return result !== 0 ? result : '';
              },
            },
          ],
        },
        {
          id: 'unpaidOwnContributions',
          label: i18n.unpaidOwnContributions[locale],
          type: 'collection',
          isRequired: false,
          init: true,
          min: 1,
          max: 1,
          fields: [
            {
              id: 'firstYear',
              label: i18n.unpaidOwnContributions.firstYear[locale],
              type: 'number',
              isRequired: false,
            },
            {
              id: 'secondYear',
              label: i18n.unpaidOwnContributions.secondYear[locale],
              type: 'number',
              isRequired: false,
            },
            {
              id: 'thirdYear',
              label: i18n.unpaidOwnContributions.thirdYear[locale],
              type: 'number',
              isRequired: false,
            },
            {
              id: 'fourthYear',
              label: i18n.unpaidOwnContributions.fourthYear[locale],
              type: 'number',
              isRequired: false,
            },
            {
              id: 'total',
              label: i18n.unpaidOwnContributions.total[locale],
              type: 'number',
              isRequired: false,
              isDisabled: true,
              computedValue: (data, itemData) => {
                let result = 0;
                if (itemData.firstYear)
                  result = result + Number(itemData.firstYear);
                if (itemData.secondYear)
                  result = result + Number(itemData.secondYear);
                if (itemData.thirdYear)
                  result = result + Number(itemData.thirdYear);
                if (itemData.fourthYear)
                  result = result + Number(itemData.fourthYear);
                return result !== 0 ? result : '';
              },
            },
          ],
        },
        {
          id: 'thirdPartyContributions',
          label: i18n.thirdPartyContributions[locale],
          type: 'collection',
          isRequired: false,
          init: true,
          min: 1,
          max: 1,
          fields: [
            {
              id: 'firstYear',
              label: i18n.thirdPartyContributions.firstYear[locale],
              type: 'number',
              isRequired: false,
            },
            {
              id: 'secondYear',
              label: i18n.thirdPartyContributions.secondYear[locale],
              type: 'number',
              isRequired: false,
            },
            {
              id: 'thirdYear',
              label: i18n.thirdPartyContributions.thirdYear[locale],
              type: 'number',
              isRequired: false,
            },
            {
              id: 'fourthYear',
              label: i18n.thirdPartyContributions.fourthYear[locale],
              type: 'number',
              isRequired: false,
            },
            {
              id: 'total',
              label: i18n.thirdPartyContributions.total[locale],
              type: 'number',
              isRequired: false,
              isDisabled: true,
              computedValue: (data, itemData) => {
                let result = 0;
                if (itemData.firstYear)
                  result = result + Number(itemData.firstYear);
                if (itemData.secondYear)
                  result = result + Number(itemData.secondYear);
                if (itemData.thirdYear)
                  result = result + Number(itemData.thirdYear);
                if (itemData.fourthYear)
                  result = result + Number(itemData.fourthYear);
                return result !== 0 ? result : '';
              },
            },
          ],
        },
        {
          id: 'restMoney',
          label: i18n.restMoney[locale],
          type: 'number',
          isRequired: false,
          isDisabled: true,
        },
        {
          id: i18n.paymentPlan[locale],
          label: 'Zahlungsplan',
          type: 'collection',
          isRequired: false,
          init: true,
          fields: [
            {
              id: 'date',
              placeholder: i18n.paymentPlan.date[locale],
              type: 'date',
              isRequired: false,
            },
            {
              id: 'description',
              placeholder: i18n.paymentPlan.description[locale],
              type: 'text',
              isRequired: false,
            },
            {
              id: 'amount',
              placeholder: i18n.paymentPlan.amount[locale],
              type: 'number',
              isRequired: false,
            },
          ],
        },
        {
          id: 'justification',
          label: i18n.justification[locale],
          type: 'textarea',
          isRequired: true,
        },
      ];
    },
  };
};

export default config;
