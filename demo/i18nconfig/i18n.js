const i18n = {
    fields: {
        field1: {
            label: {
                en: "Required input",
                de: "Ein Pflichtfeld"
            }
        },
        field2: {
            label: {
                en: "Non required input",
                de: "Ein optionales Feld"
            }
        },
        field3: {
            label: {
                en: "Just another field",
                de: "Ein weiteres Feld"
            }
        }
    },
    loadingMessage: {
        en: "Loading data, please wait ...",
        de: "Daten werden geladen, bitte warten ..."
    },
    steps: {
        one: {
            name: {
                en: "Step 1",
                de: "Schritt 1"
            },
            intro: {
                en: "As Stages doesn't render anything on it's own, internationalization of everything becomes straight forward. Different approaches are possible. This demo implemets a per text approach using a i18n file which contains all the translated strings. Check the demo implemetation for the details.",
                de: "Da Stages nichts eigenständig rendert, ist auch die Internationalisierung von allem ganz einfach. Es sind verschiedene Ansätze möglich. In dieser Demo wird pro Text mit einer i18n-Datei übersetzt. Details dazu findest du in der Source dieses Demos."
            }
        },
        two: {
            name: {
                en: "Step 2",
                de: "Schritt 2"
            }
        }
    },
    actions: {
        next: {
            en: "Next",
            de: "Nächster Schritt"
        },
        prev: {
            en: "Prev",
            de: "Vorheriger Schritt"
        },
        submit: {
            en: "Submit",
            de: "Abschicken"
        }
    },
    errors: {
        generalFieldError: {
            en: "Please fill out this field",
            de: "Bitte füllen Sie dieses Feld aus"
        }
    }
};

export default i18n;