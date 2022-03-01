import i18n from "../../../energyschweiz/ech-i18n";

const config = locale => {
    return {
        fields: (data) => {
            return [
                {
                    id: "requestingOrganisation",
                    label: i18n.requestingOrganisation[locale],
                    placeholder: `${i18n.requestingOrganisation.placeholder[locale]} *`,
                    type: "text",
                    isRequired: true
                },
                {
                    id: "responsiblePerson",
                    label: i18n.responsiblePerson[locale],
                    placeholder: `${i18n.responsiblePerson.placeholder[locale]} *`,
                    type: "text",
                    isRequired: true
                },
                {
                    id: "employees",
                    label: i18n.employees[locale],
                    type: "collection",
                    init: true,
                    fields: [
                        {
                            id: "fullName",
                            placeholder: `${i18n.employees.fullName[locale]} *`,
                            type: "text",
                            isRequired: true
                        },
                        {
                            id: "organisation",
                            placeholder: i18n.employees.organisation[locale],
                            type: "text"
                        },
                        {
                            id: "function",
                            placeholder: i18n.employees.function[locale],
                            type: "text"
                        },
                        {
                            id: "signedContract",
                            label: i18n.employees.signedContract[locale],
                            type: "checkbox"
                        }
                    ]
                },
                {
                    id: "projectPartners",
                    label: i18n.projectPartners[locale],
                    type: "collection",
                    isRequired: true,
                    init: true,
                    fields: [
                        {
                            id: "organisationName",
                            placeholder: `${i18n.projectPartners.organisationName[locale]} *`,
                            type: "text",
                            isRequired: true
                        },
                        {
                            id: "zipCode",
                            placeholder: `${i18n.projectPartners.zipCode[locale]} *`,
                            type: "text",
                            isRequired: true
                        },
                        {
                            id: "location",
                            placeholder: `${i18n.projectPartners.location[locale]} *`,
                            type: "text",
                            isRequired: true
                        },
                        {
                            id: "street",
                            placeholder: `${i18n.projectPartners.street[locale]} *`,
                            type: "text",
                            isRequired: true
                        },
                        {
                            id: "houseNumber",
                            placeholder: `${i18n.projectPartners.houseNumber[locale]} *`,
                            type: "text",
                            isRequired: true
                        },
                        {
                            id: "lastName",
                            placeholder: `${i18n.projectPartners.lastName[locale]} *`,
                            type: "text"
                        },
                        {
                            id: "firstName",
                            placeholder: `${i18n.projectPartners.firstName[locale]} *`,
                            type: "text"
                        }
                    ]
                },
                {
                    id: "projectManager",
                    label: i18n.projectManager[locale],
                    placeholder: i18n.projectManager.placeholder[locale],
                    type: "text"
                }
            ];
        }
    }
};

export default config;