import i18n from '../../../energyschweiz/ech-i18n';

const config = (locale) => {
  return {
    fields: () => {
      return [
        {
          id: 'uploads',
          label: i18n.uploads[locale],
          type: 'collection',
          isRequired: true,
          init: true,
          fields: [
            {
              id: 'upload',
              label: i18n.uploads.upload[locale],
              type: 'text',
              isRequired: false,
            },
          ],
        },
      ];
    },
  };
};

export default config;
