import { useState, isValidElement } from 'react';
import { useRouter } from 'next/router';
import { Form } from "react-stages";
import primeFields from '../../../../components/primeFields';

const CommunityForm = () => {
    const {
      query: { communitySlug, formSlug },
    } = useRouter();
    const [data, setData] = useState({});
    console.log({data});

    const renderFields = (fields, isGroup) => {
        console.log({fields});
        if (typeof fields !== "object") return null;
        return (
            <>
                {Object.keys(fields).map(key => {
                    const field = fields[key];
                    console.log({ field });
                    if (isValidElement(field)) {
                        if (isGroup) return <div className="flex-1">{field}</div>;
                        return <div>{field}</div>;
                    } else if (typeof field === "object") {
                        return <div className="flex">{renderFields(field, true)}</div>;
                    }
                })}
            </>
        );
    };

    return (
        <div>
            <h2>Community "{communitySlug}" - Form "{formSlug}"</h2>
            <Form
                id="myForm"
                data={data}
                fields={primeFields}
                config={{
                    fields: () => {
                        return [
                            {
                                id: "textgroup",
                                type: "group",
                                fields: [  
                                    {
                                        id: "field1",
                                        label: "Text 1",
                                        type: "text",
                                        isRequired: true
                                    },
                                    {
                                        id: "field2",
                                        label: "Text 2",
                                        type: "text",
                                        isRequired: true
                                    },
                                ]
                            },
                            {
                                id: "field2",
                                label: "Textarea",
                                type: "textarea",
                                isRequired: true
                            },
                            {
                                id: "field3",
                                label: "Select",
                                type: "select",
                                options: [
                                    {
                                        text: "Option 1",
                                        value: "option1"
                                    },
                                    {
                                        text: "Option 2",
                                        value: "option2"
                                    }
                                ],
                                isRequired: true
                            },
                            {
                                id: "field4",
                                label: "Calendar",
                                type: "calendar",
                                isRequired: true
                            },
                            {
                                id: "field5",
                                label: "Checkbox",
                                type: "checkbox",
                                isRequired: true
                            },
                            {
                                id: "field6",
                                label: "Switch",
                                type: "switch",
                                isRequired: true
                            },
                            {
                                id: "field7",
                                label: "Number",
                                type: "number",
                                isRequired: true
                            },
                            {
                                id: "field8",
                                label: "Rating",
                                type: "rating",
                                isRequired: true
                            },
                            {
                                id: "field9",
                                label: "Buttons",
                                type: "buttons",
                                options: [
                                    {
                                        text: "Option 1",
                                        value: "option1"
                                    },
                                    {
                                        text: "Option 2",
                                        value: "option2"
                                    }
                                ],
                                isRequired: true
                            },
                            {
                                id: "field10",
                                label: "Slider",
                                type: "slider",
                                isRequired: true
                            },
                            {
                                id: "field11",
                                label: "Toggle",
                                type: "toggle",
                                isRequired: true
                            },
                            {
                                id: "field12",
                                label: "Editor",
                                type: "editor",
                                isRequired: true
                            },
                            {
                                id: "field13",
                                label: "Chips",
                                type: "chips",
                                isRequired: true
                            },
                            {
                                id: "field14",
                                label: "Color",
                                type: "color",
                                isRequired: true
                            },
                            {
                                id: "field15",
                                label: "Mask",
                                type: "mask",
                                mask: "99-999999",
                                isRequired: true
                            },
                            {
                                id: "field16",
                                label: "Password",
                                type: "password",
                                isRequired: true
                            }
                        ]
                    }
                }}
                render={({ actionProps, fieldProps }) => {
                    return (
                        <form>
                            <div style={{ position: "relative", maxWidth: "800px", margin: "0 auto" }}>
                                {renderFields(fieldProps.fields)}
                            </div>
                        </form>
                    );
                }}
                onChange={payload => setData(payload)}
            />
        </div>
    )
};

export default CommunityForm;