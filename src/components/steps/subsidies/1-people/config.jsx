const config = {
    fields: (data) => {
        return [
            {
                id: "requestingOrganisation",
                label: "Antragstellende Organisation",
                secondaryText: "Lorem ipsum dolor sit amet",
                placeholder: "Organisation *",
                type: "text",
                isRequired: true
            },
            {
                id: "responsiblePerson",
                label: "Gesamtverantwortlicher des Projekts",
                secondaryText: "Lorem ipsum dolor sit amet",
                placeholder: "Projektleiter/in *",
                type: "text",
                isRequired: true
            },
            {
                id: "employees",
                label: "Einsatz von Mitarbeitenden",
                type: "collection",
                init: true,
                fields: [
                    {
                        id: "fullName",
                        placeholder: "Name, Vorname *",
                        type: "text",
                        isRequired: true
                    },
                    {
                        id: "organisation",
                        placeholder: "Organisation",
                        type: "text"
                    },
                    {
                        id: "function",
                        placeholder: "Funktion",
                        type: "text"
                    },
                    {
                        id: "signedContract",
                        label: "unterzeichnet Vertrag",
                        type: "checkbox"
                    }
                ]
            },
            {
                id: "projectPartners",
                label: "Weitere Projektpartner",
                type: "collection",
                isRequired: true,
                init: true,
                fields: [
                    {
                        id: "organisationName",
                        placeholder: "Organisationsname *",
                        type: "text",
                        isRequired: true
                    },
                    {
                        id: "zipCode",
                        placeholder: "Postleitzahl *",
                        type: "text",
                        isRequired: true
                    },
                    {
                        id: "location",
                        placeholder: "Ort *",
                        type: "text",
                        isRequired: true
                    },
                    {
                        id: "street",
                        placeholder: "Strasse *",
                        type: "text",
                        isRequired: true
                    },
                    {
                        id: "houseNumber",
                        placeholder: "Hausnummer *",
                        type: "text",
                        isRequired: true
                    },
                    {
                        id: "lastName",
                        placeholder: "Name",
                        type: "text"
                    },
                    {
                        id: "firstName",
                        placeholder: "Vorname",
                        type: "text"
                    }
                ]
            },
            {
                id: "projectManager",
                label: "Projektbegleiter/in BFE",
                secondaryText: "Lorem ipsum dolor sit amet",
                placeholder: "Projektbegleiter/in",
                type: "text"
            }
        ];
    }
};

export default config;