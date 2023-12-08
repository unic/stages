import { Form } from "react-stages";
import primeFields from './primeFields';
import { FieldRenderer } from './FieldRenderer';
import useStagesStore from './store';

const GeneralConfig = () => {
    const store = useStagesStore();

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
                                        showTime: true
                                    },
                                    {
                                        id: "to",
                                        type: "date",
                                        label: "To",
                                        showTime: true
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