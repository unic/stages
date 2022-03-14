import i18n from '../../../energyschweiz/ech-i18n';

const config = (locale) => {
  return {
    fields: () => {
      return [
        {
          id: 'topic',
          label: i18n.topic[locale],
          placeholder: i18n.topic.placeholder[locale],
          type: 'text',
          isRequired: true,
        },
        {
          id: 'projectTitle',
          label: i18n.projectTitle[locale],
          tooltip: i18n.projectTitle.placeholder[locale],
          type: 'text',
          isRequired: true,
        },
        {
          id: 'fromDate',
          label: i18n.fromDate[locale],
          type: 'date',
          isRequired: true,
        },
        {
          id: 'toDate',
          label: i18n.toDate[locale],
          type: 'date',
          isRequired: true,
        },
        {
          id: 'initialSituation',
          label: i18n.initialSituation[locale],
          type: 'textarea',
          isRequired: true,
        },
        {
          id: 'descriptionAndProcedure',
          label: i18n.descriptionAndProcedure[locale],
          tooltip: i18n.descriptionAndProcedure.tooltip[locale],
          type: 'textarea',
          isRequired: true,
        },
        {
          id: 'requirements',
          label: i18n.requirements[locale],
          placeholder: i18n.requirements.placeholder[locale],
          tooltip: i18n.requirements.tooltip[locale],
          type: 'textarea',
          isRequired: true,
        },
        {
          id: 'goals',
          label: i18n.goals[locale],
          type: 'collection',
          isRequired: true,
          init: true,
          fields: [
            {
              id: 'goal',
              placeholder: `${i18n.goals.goal[locale]} *`,
              tooltip: i18n.goals.goal.tooltip[locale],
              type: 'text',
              isRequired: true,
            },
            {
              id: 'successIndicator',
              placeholder: `${i18n.goals.successIndicator[locale]} *`,
              tooltip: i18n.goals.successIndicator.tooltip[locale],
              type: 'text',
              isRequired: true,
            },
          ],
        },
        {
          id: 'impactsAndMeasurements',
          label: i18n.impactsAndMeasurements[locale],
          type: 'collection',
          isRequired: true,
          init: true,
          fields: [
            {
              id: 'impact',
              placeholder: `${i18n.impactsAndMeasurements.impact[locale]} *`,
              tooltip: i18n.impactsAndMeasurements.impact.tooltip[locale],
              type: 'text',
              isRequired: true,
            },
            {
              id: 'successIndicator',
              placeholder: `${i18n.impactsAndMeasurements.successIndicator[locale]} *`,
              tooltip: i18n.impactsAndMeasurements.successIndicator.tooltip[locale],
              type: 'text',
              isRequired: true,
            },
          ],
        },
        {
          id: 'targetGroups',
          label: i18n.targetGroups[locale],
          type: 'collection',
          isRequired: true,
          init: true,
          fields: [
            {
              id: 'group',
              placeholder: `${i18n.targetGroups.group[locale]} *`,
              tooltip: i18n.targetGroups.group.tooltip[locale],
              type: 'text',
              isRequired: true,
            },
            {
              id: 'groupIdentification',
              placeholder: `${i18n.targetGroups.groupIdentification[locale]} *`,
              tooltip: i18n.targetGroups.groupIdentification.tooltip[locale],
              type: 'text',
              isRequired: true,
            },
          ],
        },
        {
          id: 'regionCoverage',
          label: i18n.regionCoverage[locale],
          type: 'checkBoxGroup',
          options: [
            { value: 'CH_DE', text: i18n.regionCoverage.options.de[locale] },
            { value: 'CH_FR', text: i18n.regionCoverage.options.fr[locale] },
            { value: 'CH_IT', text: i18n.regionCoverage.options.it[locale] },
          ],
        },
        {
          id: 'services',
          label: i18n.services[locale],
          type: 'textarea',
          isRequired: true,
        },
      ];
    },
  };
};

export default config;
