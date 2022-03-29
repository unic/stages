import FieldError from "../../components/I18nFieldError";

const config = (locale, i18n) => {
    return {
        fields: () => {
            return [
                {
                    id: "field1",
                    label: i18n.fields.field1.label[locale],
                    type: "text",
                    isRequired: true,
                    errorRenderer: (error) => FieldError({ error, locale, i18n })
                },
                {
                    id: "field2",
                    label: i18n.fields.field2.label[locale],
                    type: "text",
                    errorRenderer: (error) => FieldError({ error, locale, i18n })
                }
            ];
        }
    };
};

export default config;