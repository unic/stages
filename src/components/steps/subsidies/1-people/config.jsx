import i18n from '../../../energyschweiz/ech-i18n';
import FieldError from '../components/FieldError';

const config = (locale) => {
  return {
    fields: () => {
      return [
        {
          id: 'requestingOrganisation',
          label: i18n.requestingOrganisation[locale],
          placeholder: `${i18n.requestingOrganisation.placeholder[locale]} *`,
          type: 'text',
          isRequired: true,
          errorRenderer: (error) => FieldError({ error, locale }),
        },
        {
          id: 'responsiblePerson',
          label: i18n.responsiblePerson[locale],
          placeholder: `${i18n.responsiblePerson.placeholder[locale]} *`,
          type: 'text',
          isRequired: true,
          errorRenderer: (error) => FieldError({ error, locale }),
        },
        {
          id: 'employees',
          label: i18n.employees[locale],
          type: 'collection',
          init: true,
          fields: [
            {
              id: 'fullName',
              placeholder: `${i18n.employees.fullName[locale]} *`,
              type: 'text',
              isRequired: true,
              errorRenderer: (error) => FieldError({ error, locale }),
            },
            {
              id: 'organisation',
              placeholder: i18n.employees.organisation[locale],
              type: 'text',
              errorRenderer: (error) => FieldError({ error, locale }),
            },
            {
              id: 'function',
              placeholder: i18n.employees.function[locale],
              type: 'text',
              errorRenderer: (error) => FieldError({ error, locale }),
            },
            {
              id: 'signedContract',
              label: i18n.employees.signedContract[locale],
              type: 'checkbox',
              errorRenderer: (error) => FieldError({ error, locale }),
            },
          ],
        },
        {
          id: 'projectPartners',
          label: i18n.projectPartners[locale],
          type: 'collection',
          isRequired: true,
          init: true,
          fields: [
            {
              id: 'organisationName',
              placeholder: `${i18n.projectPartners.organisationName[locale]} *`,
              type: 'text',
              isRequired: true,
              errorRenderer: (error) => FieldError({ error, locale }),
            },
            {
              id: 'zipCode',
              placeholder: `${i18n.projectPartners.zipCode[locale]} *`,
              type: 'text',
              isRequired: true,
              errorRenderer: (error) => FieldError({ error, locale }),
            },
            {
              id: 'location',
              placeholder: `${i18n.projectPartners.location[locale]} *`,
              type: 'text',
              isRequired: true,
              errorRenderer: (error) => FieldError({ error, locale }),
            },
            {
              id: 'street',
              placeholder: `${i18n.projectPartners.street[locale]} *`,
              type: 'text',
              isRequired: true,
              errorRenderer: (error) => FieldError({ error, locale }),
            },
            {
              id: 'houseNumber',
              placeholder: `${i18n.projectPartners.houseNumber[locale]} *`,
              type: 'text',
              isRequired: true,
              errorRenderer: (error) => FieldError({ error, locale }),
            },
            {
              id: 'lastName',
              placeholder: `${i18n.projectPartners.lastName[locale]} *`,
              type: 'text',
              errorRenderer: (error) => FieldError({ error, locale }),
            },
            {
              id: 'firstName',
              placeholder: `${i18n.projectPartners.firstName[locale]} *`,
              type: 'text',
              errorRenderer: (error) => FieldError({ error, locale }),
            },
          ],
        },
        {
          id: 'projectManager',
          label: i18n.projectManager[locale],
          placeholder: i18n.projectManager.placeholder[locale],
          tooltip: i18n.projectManager.tooltip[locale],
          type: 'text',
          errorRenderer: (error) => FieldError({ error, locale }),
        },
      ];
    },
  };
};

export default config;
