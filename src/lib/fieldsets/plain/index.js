import Input, { isValid as inputIsValid } from "./Input";
import CheckBox, { isValid as checkBoxIsValid } from "./CheckBox";
import Select, { isValid as selectIsValid } from "./Select";
import RadioGroup, { isValid as radioGroupIsValid } from "./RadioGroup";
import Dummy from "./Dummy";

const inputProps = [
    "id",
    "label",
    "value",
    "onChange",
    "onBlur",
    "onFocus",
    "error",
    "placeholder",
    "isRequired",
    "isDisabled",
    "isValidating",
    "hasFocus",
    "prefix",
    "suffix",
    "secondaryText",
    "type",
    "errorRenderer"
];

const checkboxProps = [
    "id",
    "label",
    "value",
    "onChange",
    "onBlur",
    "onFocus",
    "error",
    "placeholder",
    "isRequired",
    "isDisabled",
    "isValidating",
    "prefix",
    "suffix",
    "secondaryText",
    "type",
    "errorRenderer"
];

const selectProps = [
    "id",
    "label",
    "value",
    "options",
    "onChange",
    "onBlur",
    "onFocus",
    "error",
    "placeholder",
    "isRequired",
    "isDisabled",
    "isValidating",
    "prefix",
    "suffix",
    "secondaryText",
    "errorRenderer"
];

const radiogroupProps = [
    "id",
    "label",
    "value",
    "options",
    "onChange",
    "onBlur",
    "onFocus",
    "error",
    "isRequired",
    "isDisabled",
    "isValidating",
    "prefix",
    "suffix",
    "secondaryText",
    "errorRenderer"
];

const dummyProps = [
    "id",
    "label",
    "error",
    "isRequired",
    "isValidating",
    "secondaryText",
    "errorRenderer"
];

const fields = {
    text: {
        component: Input,
        validate: inputIsValid,
        props: inputProps
    },
    number: {
        component: Input,
        validate: inputIsValid,
        props: inputProps
    },
    email: {
        component: Input,
        validate: inputIsValid,
        props: inputProps
    },
    password: {
        component: Input,
        validate: inputIsValid,
        props: inputProps
    },
    tel: {
        component: Input,
        validate: inputIsValid,
        props: inputProps
    },
    time: {
        component: Input,
        validate: inputIsValid,
        props: inputProps
    },
    date: {
        component: Input,
        validate: inputIsValid,
        props: inputProps
    },
    checkbox: {
        component: CheckBox,
        validate: checkBoxIsValid,
        props: checkboxProps,
        transform: value => !!value
    },
    select: {
        component: Select,
        validate: selectIsValid,
        props: selectProps
    },
    radio: {
        component: RadioGroup,
        validate: radioGroupIsValid,
        props: radiogroupProps
    },
    dummy: {
        component: Dummy,
        validate: () => true,
        props: dummyProps
    }
};

export default fields;