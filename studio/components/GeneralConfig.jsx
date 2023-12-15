import { useEffect } from 'react';
import { Form } from "react-stages";
import primeFields from './primeFields';
import { FieldRenderer } from './FieldRenderer';
import useStagesStore from './store';

const GeneralConfig = () => {
    const store = useStagesStore();

    useEffect(() => {
        useStagesStore.persist.rehydrate();
    }, []);

    return (
        <>
            <Form
                key={`generalConfig`}
                id={`generalConfig`}
                data={store.generalConfig}
                fields={primeFields}
                config={{
                    fields: () => {
                        return [
                            {
                                id: "title",
                                type: "text",
                                label: "Title",
                                isRequired: true
                            },
                            {
                                id: "slug",
                                type: "text",
                                label: "Slug",
                                isRequired: true,
                                isDisabled: true
                            },
                            {
                                id: "type",
                                type: "buttons",
                                label: "Type",
                                defaultValue: "form",
                                options: [
                                    {
                                        value: "form",
                                        text: "Form"
                                    },
                                    {
                                        value: "wizard",
                                        text: "Wizard"
                                    }
                                ]
                            },
                            {
                                id: "locales",
                                type: "select",
                                label: "Locales",
                                options: [
                                    {
                                        value: "EN",
                                        text: "English"
                                    },
                                    {
                                        value: "DE",
                                        text: "Deutsch"
                                    },
                                    {
                                        value: "FR",
                                        text: "French"
                                    }
                                ]
                            },
                            {
                                id: "status",
                                type: "buttons",
                                label: "Status",
                                defaultValue: "draft",
                                options: [
                                    {
                                        value: "draft",
                                        text: "Draft"
                                    },
                                    {
                                        value: "published",
                                        text: "Published"
                                    },
                                    {
                                        value: "archived",
                                        text: "Archived"
                                    }
                                ]
                            },
                            {
                                id: "date",
                                type: "group",
                                label: "Date",
                                fields: [
                                    {
                                        id: "from",
                                        type: "calendar",
                                        label: "From",
                                        showTime: true,
                                        hideOnDateTimeSelect: true
                                    },
                                    {
                                        id: "to",
                                        type: "calendar",
                                        label: "To",
                                        showTime: true,
                                        hideOnDateTimeSelect: true
                                    }
                                ]
                            }
                        ];
                    }
                }}
                render={({ actionProps, fieldProps }) => {
                    return (
                        <>
                            <form>
                                <div style={{ position: "relative", margin: "-8px" }}>
                                    <FieldRenderer
                                        parent="_"
                                        fieldProps={fieldProps}
                                        fields={fieldProps.fields}
                                        isFieldConfigEditor
                                    />
                                </div>
                            </form>
                        </>
                    );
                }}
                onChange={payload => {
                    store.updateGeneralConfig(payload);
                }}
            />
        </>
    )
};

export default GeneralConfig;