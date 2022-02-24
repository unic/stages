import Input, { isValid as inputIsValid } from "./Input";
import TextArea, { isValid as textAreaIsValid } from "./TextArea";
import CheckBox, { isValid as checkBoxIsValid } from "./CheckBox";
import Select, { isValid as selectIsValid } from "./Select";
import RadioGroup, { isValid as radioGroupIsValid } from "./RadioGroup";
import CheckBoxGroup, { isValid as checkBoxGroupIsValid } from "./CheckBoxGroup";

const fields = {
    text: {
        component: Input,
        isValid: inputIsValid
    },
    textarea: {
        component: TextArea,
        isValid: textAreaIsValid
    },
    number: {
        component: Input,
        isValid: inputIsValid
    },
    email: {
        component: Input,
        isValid: inputIsValid
    },
    password: {
        component: Input,
        isValid: inputIsValid
    },
    tel: {
        component: Input,
        isValid: inputIsValid
    },
    time: {
        component: Input,
        isValid: inputIsValid
    },
    date: {
        component: Input,
        isValid: inputIsValid
    },
    checkbox: {
        component: CheckBox,
        isValid: checkBoxIsValid
    },
    select: {
        component: Select,
        isValid: selectIsValid
    },
    radioGroup: {
        component: RadioGroup,
        isValid: radioGroupIsValid
    },
    checkBoxGroup: {
        component: CheckBoxGroup,
        isValid: checkBoxGroupIsValid
    }
};

export default fields;