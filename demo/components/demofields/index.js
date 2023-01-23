import Input, { isValid as inputIsValid } from "./Input";
import CheckBox, { isValid as checkBoxIsValid } from "./CheckBox";
import Select, { isValid as selectIsValid } from "./Select";
import RadioGroup, { isValid as radioGroupIsValid } from "./RadioGroup";
import Dummy from "./Dummy";

const fields = {
    text: {
        component: Input,
        isValid: inputIsValid
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
    multiselect: {
        component: Select,
        isValid: selectIsValid
    },
    radio: {
        component: RadioGroup,
        isValid: radioGroupIsValid
    },
    dummy: {
        component: Dummy,
        isValid: () => true
    }
};

export default fields;