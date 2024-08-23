import React, { useState } from "react";
import { Form } from "react-stages";
import fields from "../components/demofields";
import Layout from "../components/Layout";
import Paragraph from "../components/demofields/parts/Paragraph";
import Heading from "../components/demofields/parts/Heading";
import HR from "../components/HR";

function FormPage() {
  const [data, setData] = useState({});
  return (
    <Layout>
      <Form
        data={data}
        fields={fields}
        config={{
          fields: () => {
            return [
              {
                id: "uppercase",
                label: "Uppercase",
                type: "text",
                transform: [
                    {
                        event: "change",
                        fn: value => value && value.toUpperCase()
                    }
                ]
              },
              {
                id: "iban",
                label: "Iban",
                placeholder: "CH00 0000 0000 0000 0000 0",
                type: "text",
                maxLength: 19,
                transform: [
                  {
                    event: "change",
                    fn: (value, oldValue) => {
                      // Stop at 26 chars (IBANs can't be longer than that, including spaces)
                      if (value && value.length > 26) return oldValue;

                      // Remove spaces which are inserted too early:
                      if (
                        value &&
                        value.length > 5 &&
                        value.endsWith(" ") &&
                        (value[value.length - 1] === " " ||
                          value[value.length - 2] === " " ||
                          value[value.length - 3] === " ")
                      )
                        return value.slice(0, -1);

                      // Add spaces at the right moment:
                      return value && // First make sure there is a value
                        oldValue && // ... and an old value
                        oldValue.length < value.length && // and only transform if the new value is longer than the old
                        value.length > 3 && // and the value is at least 4 characters long
                        value.length < 25 && // and the value is at most 24 characters long
                        value[value.length - 1] !== " " && // and the last four characters is not a space
                        value[value.length - 2] !== " " &&
                        value[value.length - 3] !== " " &&
                        value[value.length - 4] !== " "
                        ? value.length > 4 && value[value.length - 5] !== " "
                          ? value.slice(0, -1) + " " + value.slice(-1) // Insert space after 4th character (needed after use of backspace)
                          : value + " "
                        : value;
                    },
                  },
                ],
              },
            ];
          },
        }}
        render={({ actionProps, fieldProps }) => (
          <form>
            <Heading>Transforms</Heading>
            <Paragraph>
              Transforms let's you dynamically transform any kind of user input.
              You can use this to for simple string transforms, like uppercase
              everything, or for more complex things like masking.
            </Paragraph>
            <div>{fieldProps.fields.uppercase}</div>
            <br />
            <div>{fieldProps.fields.iban}</div>
            <br />
            <HR isDirty={fieldProps.isDirty} />
            <br />
            <button
              type="button"
              onClick={() =>
                actionProps.handleActionClick(
                  (payload) => console.log("onSubmit:", payload),
                  true
                )
              }
            >
              Submit
            </button>
          </form>
        )}
        onChange={(payload) => setData(payload)}
      />
    </Layout>
  );
}

export default FormPage;
