import FieldError from "../../components/I18nFieldError";

const config = (locale, i18n) => {
    return {
        fields: () => {
            return [
                {
                    id: "field3",
                    label: i18n.fields.field3.label[locale],
                    type: "text",
                    isRequired: true,
                    errorRenderer: (error) => FieldError({ error, locale, i18n })
                }
            ];
        }
    }
};

export default config;