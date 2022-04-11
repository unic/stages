# Stages

<img src="https://unpkg.com/react-stages@0.1.17/stages-logo.png" align="right" title="Stages" width="400">

Stages, super flexible and lightweight (42.7 KB minified, 15.9 KB GZipd) wizard and form components for React

**This component is currently not production ready! The API will probably slightly change before v1 release. Use at your own risk.**

> There are many wizard and form libraries out there so why should you choose this one? This wizard is different. No styles. No fixed layouts. Not even fixed behaviour! You want to put your wizard steps into an accordion? Go for it! You want to jump back to step 2 after step 4 and then display slightly different data based on data added on step 3? Go for it! You want a step with zero input fields, one that just displays information? Go for it! You don’t even want to build a wizard but a quiz which tells you how many questions you’ve got right? Go for it! You finally want a slideshow where all slides fit into your set duration? You can build it with Stages! You have such a complicated project that everything is custom? No ballast with this one! No styles to overwrite! This wizard is different because it makes building complicated things simple, by combining a few well thought out simple, but super flexible building blocks without pressing you into a corset of limitations. It’s meant to build wizards, but it can be used to build a thousand other things and make those things great with little effort.

[Demos](https://stages-demo.vercel.app/)

## Possible Usecases:

- Forms (one stage)
- Wizards (multiple stages, linear progression)
- Dynamic Wizard (multiple dynamic stages, non linear progression)
- Text Adventure (multiple stages, free progression)
- Quiz (One or multiple stages, with custom validation and locked fields)
- Accordion Form (stages rendered inside an accordion)
- Slideshow (multiple stages, no validation, keyboard navigation)
- Router (for SPAs)

## Installation

Installation:

`npm i react-stages --save`

## Component Structure

This is the basic component structure for a wizard:

<img src="https://unpkg.com/react-stages@0.1.19/stages-structure.png" title="Stages Structure" width="100%">

## The Form Component

The form component is optimized to work together with the wizard component, but you can of course use it for any kind of forms. It's the backbone to building higly dynamic wizards by constantly being aware on the state of a wizards steps.

A simple form:

```
import { Form, plainFields as fields } from "react-stages";

<Form
    fields={fields}
    config={{
        fields: () => {
            return [
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
            ]
        }
    }}
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

To use one of the example fieldsets, import them like this:

```
import { plainFields as fields } from "react-stages";
```

Look into the source for additional simple Bootstrap 5 fields (don't forget to import the Bootstrap styles, read the react-bootstrap instructions for how to do that). In the future we will publish packages for fieldsets.

### Config

In this property you configurate the fields in your form. At a minimum you have to add an `id` and `type`. The id has to be unique and the type references a field you supllied to the form. All other properties can vary based on the fields you supply, but things like `label` should be added for all of them for accessibility reasons.

A special type of field is the `collection` type. It creates an array of grouped fields. An example config:

```
[
    {
        id: "maths",
        label: "Maths",
        type: "collection",
        init: true,
        isRequired: true,
        uniqEntries: true,
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

Additionally you have a 'filter' property which you can use to filter the value automatically on change, for example to limit an input to only number like in this example field config:

```
{
    id: "onlyNumbers",
    label: "Only numbers",
    type: "text",
    filter: value => value.replace(/\D/g,'')
}
```

### Render

The render property finally renders the form. You get two properties with it, `actionProps` and `fieldProps`. They contain helpers for actions, for example to only execute them if the form is valid, and `fieldProps` that contains all the rendered fields.

### onChange

And last but not least, the onChange prop is triggered everytime new data is added.

### validateOn

You can select the validation behaviour of a form with the `validateOn` prop. Per default, it will only validate on actions, 
for example on submit, but you add different events which than trigger validation. In the example below, validation will happen on 
form actions and on blur:

```
validateOn={["action", "blur"]}
```

You have following options to choose from, you can add as many of them as you like: `action`, `blur`, `change` and `collectionAction`.

## The Wizard Component

The wizard component, called Stages, takes multiple forms and creates a wizard out of them. Here's an example with two steps:

```
import React, { Fragment } from "react";
import { Stages, Form, Navigation, Progression, HashRouter } from "react-stages";

// ... import form configs and renderers here! See the above form example for how.

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
                    id={key}
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
                    id={key}
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

### Initial Data

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

Top level being the step keys and than the structure of your form configs.

### Render

The render prop renders the wizard. You can use the default components that come with Stages, as shown below:

```
render={({ navigationProps, progressionProps, routerProps, steps }) => (
    <div>
        <Navigation {...navigationProps} />
        <Progression {...progressionProps} />
        {steps}
        {typeof window !== "undefined" ? <HashRouter {...routerProps} /> : null}
    </div>
)}
```

The `navigationProps` contains everything you need to build your own wizard navigation:

- currentStep (the currently active wizard step)
- data (current data, you can use it to diusplay step summaries in your navigation)
- onChangeStep (use this callback to jump to a new step number)
- errors (the error object, for example to indicate a step which is not valid)
- lastValidStep (the last step which is valid)
- keys (an object with all step keys and if they are visible)
- stepCount (the complete step count)

The `progressionProps` can be used to display wizard progression stats. You get following data:

- stepCount (total amount of steps)
- validSteps (amount of valid steps)
- percentage (percentage done)

The `routerProps` can be used either with Stages own HashRouter or with whatever routing you want to supply.

- step (the current step)
- onChange (callback to change the current step)
- keys (an object of step keys)

The HashRouter has options for a `prefix` and a `hashFormat`. Per default the `hashFormat` is a Google hashbang like `#!step1`, but you can easily change it to a non hashbang like this:

```
<HashRouter {...routerProps} hashFormat="#" />
```

And finally the `steps` prop contains the rendered steps.

### Children

Steps are rendered as children of the Stages component. Rendering is up to you. Have a look at the example how that's done. Normally you render our Form component, but you can render whatever you want isnide your step.

A few important rules:

1. You need to return the step key like this:

```
const key = setStepKey("myStepKey", index);
```

2. Right after that you need to return `null` while initializing. This makes sure that the wizard doesn't render steps before it has all the needed information.

```
if (initializing) return null;
```

3. If a step doesn't return a form, you need to set some data on it when active to make sure the step becomes `done`:

```
if (!data || Object.keys(data).length === 0) onChange({visited: true}, {}, index);
```

4. If you use our form component, you need to connect it to Stages like this:

```
data={data}
onChange={onChange}
isVisible={isActive}
```

This makes sure only the active step is being rendered and that data always stays in sync.

Here are all the props each child gets:

- data (the current step data)
- allData (data from all steps)
- isActive (is this step active)
- onChange (the callback for all changes. Return the latest data)
- onNav (can be used for action buttons of the form, for example to navigate to the nbext step. Data is being validated!)
- index (the index of the current step)
- errors (an object of all validation errors)
- setStepKey (callback to set the steps key)
- initializing (flag which indicates if the wizard is being initialized)

The `onNav` callback can act on the following navTypes:

- next (jump to next step)
- prev (jump to previous step)
- first (jump to first step)
- last (jump to last step)
- lastValid (jump to last valid step)
- step (jump to specific step)

If validation is activated on Stages (`validateOnStepChange = true`), than onNav will only jump to valid steps.

### Debug your steps

While developing steps, it can be tiresome to always step through the wizard and enter valid data to get to specific step. There is however a simple way to force Stages to always jump to a certain step:

```
<Stages
    initialStep={1}
    validateOnStepChange={false}
>
    ...
</Stages>
```

### Add custom validations to your field

Sometimes validation has to be on a per field basis. In the example below, we check that the fromDate isn't after the toDate:

```
{
    id: 'fromDate',
    label: "From",
    type: 'date',
    isRequired: true,
},
{
    id: 'toDate',
    label: "To",
    type: 'date',
    isRequired: true,
    customValidation: ({ data, allData, fieldConfig, isValid }) => {
        if (allData.fromDate && data) {
            const fromDate = new Date(allData.fromDate);
            const toDate = new Date(data);
            // Make sure fromDate isn't bigger than toDate:
            if (fromDate > toDate) return false;
        }
        return isValid;
    },
}
```

### Form recursion with subforms (aka Inception Mode)

To include a complete form as a field in another form, with data propagation, create a `subform` field like this:

```
{
    id: "address",
    type: "subform",
    config: addressConfig,
    render: AddressRender
}
```

Where `config` and `render` works the same way as the same properties on the Form component. The data and errors are automatically 
synced up to the parent and root components, which means you can create ulimited deep data/form structures. This can be very useful if you 
for example have a subform which needs to load async data but is not always shown, to prevent loading that data even if there's no need for it.