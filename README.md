# Stages

Stages, super flexible wizard and form components for React

**This component is currently not production ready!!! Use at your own risk.**

> There are many wizard and form libraries out there so why should you choose this one? This wizard is different. No styles. No fixed layouts. Not even fixed behaviour! You want to put your wizard steps into an accordion? Go for it! You want to jump back to step 2 after step 4 and then display slightly different data based on data added on step 3? Go for it! You want a step with zero input fields, one that just displays information? Go for it! You don’t even want to build a wizard but a quiz which tells you how many questions you’ve got right? Go for it! You finally want a slideshow where all slides fit into your set duration? You can build it with Stages! You have such a complicated project that everything is custom? No ballast with this one! No styles to overwrite! This wizard is different because it makes building complicated things simple, by combining a few well thought out simple, but super flexible building blocks without pressing you into a corset of limitations. It’s meant to build wizards, but it can be used to build a thousand other things and make those things great with little effort.

## Installation

Installation:

`npm i react-stages --save`

## The Form Component

The form component is optimized to work together with the wizard component, but you can of course use it for any kind of forms.

A simple form:

```
import { Form } from "react-stages";

<Form
    fields={[
        email: {
            component: Input,
            isValid: emailIsValid
        },
        password: {
            component: Input,
            isValid: passwordIsValid
        }
    ]}
    config={[
        {
            id: "email",
            label: "Email",
            type: "email",
            isRequired: true
        },
        {
            id: "password",
            label: "Password",
            type: "password",
            isRequired: true
        }
    ]}
    render={({ actionProps, fieldProps }) => (
        <>
            <div>
                {fieldProps.fields.email}
                <br />
                {fieldProps.fields.password}
            </div>
            <hr />
            <button
                type="button"
                onClick={() => actionProps.handleActionClick(payload => console.log("onSubmit:", payload), true)}
            >
                Submit
            </button>
        </>
    )}
    onChange={payload => console.log("onChange:", payload)}
/>
```

Looks a little complicated at first, but only because the form component is built for flexibility and doesn't render any components on its own. You have to supply all the components!

Let's go through the properties to get a better understanding of what does what.

### Fields

The form component doesn't have form fields built in, you have to add your own fields (or import one of the field sets that come with this package). In this example we'll add two fields. Both use the same component `Input` which is a simple HTML input field. The difference between the two is the type property we set on the field and the validation callback. The Input component looks like this:

```
const Input = ({
    id,
    label,
    value,
    onChange,
    error,
    placeholder,
    isRequired,
    isDisabled,
    prefix,
    suffix,
    secondaryText,
    type
}) => {
    return (
        <div id={id}>
            <label htmlFor={id}>{label}{isRequired ? " *" : ""}</label>
            <div>
                {prefix ? <span>{prefix}</span> : null}
                <input
                    name={id}
                    value={value || ""}
                    placeholder={placeholder}
                    type={type || "text"}
                    disabled={!!isDisabled}
                    required={!!isRequired}
                    onChange={e => {
                        if (typeof onChange === "function") onChange(e.target.value);
                    }}
                />
                {suffix ? <span>{suffix}</span> : null}
            </div>
            {secondaryText ? <div>{secondaryText}</div> : null}
            {error ? <div style={{ color: "red" }}>Bitte füllen Sie dieses Feld aus!</div> : null}
        </div>
    );
}
```

The simplified emailIsValid function looks like this:

```
const emailIsValid = (value, config) => {
    if (config.isRequired && (value === "" || typeof value === "undefined" || value.indexOf("@") === -1)) return false;
    return true;
}
```

You can add any kind of fields, even fields which don't update any data. Have a look at the field collections in this package for more examples.

### Config

In this property you configurate the fields in your form. At a minimum you have to add an `id` and `type`. The id has to be unique and the type references a field you supllied to the form. All other properties can vary based on the fields you supply, but things like `label`  should be added for all of them for accessibility reasons.

A special type of field is the `collection` type. It creates an array of grouped fields. An example config:

```
[
    {
        id: "maths",
        label: "Maths",
        type: "collection",
        init: true,
        min: 2,
        max: 5,
        fields: [
            {
                id: "factor1",
                label: "Factor 1",
                type: "number"
            },
            {
                id: "factor2",
                label: "Factor 2",
                type: "number"
            },
            {
                id: "result",
                label: "Result of Factor 1 x Factor 2",
                type: "number",
                isDisabled: true,
                computedValue: (data, itemData) => {
                    let result = 0;
                    if (itemData.factor1 && itemData.factor2) {
                        result = Number(itemData.factor1) * Number(itemData.factor2);
                    }
                    return result !== 0 ? result : "";
                }
            }
        ]
    }
]
```

The `computedValue` property above can be added to all fields, it let's you compute values taking data from the other fields or like in this example, the data of the specific collection entry.

### Render

The render property finally renders the form. You get two properties with it, `actionProps` and `fieldProps`. They contain helpers for actions, for example to only execute them if the form is valid, and `fieldProps` that contains all the rendered fields.

### onChange

And last but not least, the onChange prop is triggered everytime new data is added.

## The Wizard Component

The wizard component, called Stages, takes multiple forms and creates a wizard out of them. Here's an example with two steps:

```
import React, { Fragment } from "react";
import { Stages, Form, Navigation, Progression, HashRouter } from "react-stages";

<Stages
    initialData={{}}
    render={({ navigationProps, progressionProps, routerProps, steps }) => (
        <div>
            <Navigation {...navigationProps} />
            <Progression {...progressionProps} />
            {steps}
            {typeof window !== "undefined" ? <HashRouter {...routerProps} /> : null}
        </div>
    )}
>
    {({ data, allData, isActive, onChange, onNav, index, errors, setStepKey, initializing }) => {
        const key = setStepKey("basics", index);
        if (initializing) return null;

        return (
            <Fragment key={`step-${key}`}>
                {isActive ? <h2>Basics:</h2> : null}
                <Form
                    id={index}
                    data={data}
                    config={basicsConfig}
                    render={({ actionProps, fieldProps, loading }) => (
                        <FormLayout
                            loading={loading}
                            fields={<BasicsRenderer {...fieldProps} />}
                            actions={<Actions
                                config={createActionButtonConfig("first", onNav, onSubmit, data)}
                                {...actionProps}
                            />}
                        />
                    )}
                    fields={fields}
                    onChange={onChange}
                    isVisible={isActive}
                />
            </Fragment>
        );
    }}
    {({ data, allData, isActive, onChange, onNav, index, errors, setStepKey, initializing }) => {
        const key = setStepKey("guests", index);
        if (initializing) return null;

        return (
            <Fragment key={`step-${key}`}>
                {isActive ? <h2>Guests:</h2> : null}
                <Form
                    id={index}
                    data={data}
                    config={guestsConfig}
                    render={({ actionProps, fieldProps, loading }) => (
                        <FormLayout
                            loading={loading}
                            fields={<GuestsRenderer {...fieldProps} />}
                            actions={<Actions
                                config={createActionButtonConfig("regular", onNav, onSubmit, data)}
                                {...actionProps}
                            />}
                        />
                    )}
                    fields={fields}
                    onChange={onChange}
                    isVisible={isActive}
                />
            </Fragment>
        );
    }}
</Stages>
```

For unlimited flexibility, we use render props and component composition everywhere. Let's step through the properties first.

### Initial Data

Here you can supply initial data to the wizard. This can be useful if you have some storage somehere and want to let the user edit his previous data in the wizard.

Data is structured like this:

```
{
    firstStep: {
        email: "test@domain.com",
        username: "Tester",
        maths: [
            { factor1: 3, factor2: 7 }
        ]
    },
    anotherStep: {
        anotherFieldId: "Bla, bla, bla ..."
    }
}
```