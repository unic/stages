import { useState } from 'react';
import { useRouter } from 'next/router';
import { Form } from "react-stages";
import primeFields from '../../../../components/primeFields';

const CommunityForm = () => {
    const {
      query: { communitySlug, formSlug },
    } = useRouter();
    const [data, setData] = useState({});

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