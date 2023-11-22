import { useState } from 'react';
import { useRouter } from 'next/router';
import { Form } from "react-stages";
import primeFields from '../../../../components/primeFields';

const CommunityForm = () => {
    const {
      query: { communitySlug, formSlug },
    } = useRouter();
    const [data, setData] = useState({});
    console.log({data});
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
                                id: "field1",
                                label: "Text",
                                type: "text",
                                isRequired: true
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
                            }
                        ]
                    }
                }}
                render={({ actionProps, fieldProps }) => (
                    <form>
                        <div>
                            {fieldProps.fields.field1}
                            <br /><br />
                            {fieldProps.fields.field2}
                            <br /><br />
                            {fieldProps.fields.field3}
                            <br /><br />
                            {fieldProps.fields.field4}
                            <br /><br />
                            {fieldProps.fields.field5}
                            <br /><br />
                            {fieldProps.fields.field6}
                            <br /><br />
                            {fieldProps.fields.field7}
                            <br /><br />
                            {fieldProps.fields.field8}
                            <br /><br />
                            {fieldProps.fields.field9}
                            <br /><br />
                            {fieldProps.fields.field10}
                            <br /><br />
                            {fieldProps.fields.field11}
                            <br /><br />
                            {fieldProps.fields.field12}
                            <br /><br />
                            {fieldProps.fields.field13}
                            <br /><br />
                            {fieldProps.fields.field14}
                            <br /><br />
                            {fieldProps.fields.field15}
                        </div>
                        <hr />
                        <button
                            type="button"
                            onClick={() => actionProps.handleActionClick(payload => console.log("onSubmit:", payload), true)}
                        >
                            Submit
                        </button>
                    </form>
                )}
                onChange={payload => setData(payload)}
            />
        </div>
    )
};

export default CommunityForm;