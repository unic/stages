import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Checkbox } from 'primereact/checkbox';
import { InputSwitch } from 'primereact/inputswitch';

const removeStagesProps = (props) => {
    const cleanedProps = { ...props };
    cleanedProps.disabled = cleanedProps.isDisabled;
    cleanedProps.error =
        cleanedProps.error && cleanedProps.errorRenderer
        ? typeof cleanedProps.errorRenderer === 'function'
            ? cleanedProps.errorRenderer(cleanedProps.error, props)
            : cleanedProps.errorRenderer
        : cleanedProps.error;
    delete cleanedProps.isDisabled;
    delete cleanedProps.isRequired;
    delete cleanedProps.customValidation;
    delete cleanedProps.errorRenderer;
    delete cleanedProps.validateOn;
    delete cleanedProps.initialValue;
    delete cleanedProps.isDirty;
    delete cleanedProps.hasFocus;
    delete cleanedProps.regexValidation;
    return cleanedProps;
};

const MappedInputText = (props) => {
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined') mappedProps.value = '';
    mappedProps.type = 'text';
    mappedProps.onChange = (e) => {
        props.onChange(e.target.value);
    };
    return <InputText {...mappedProps} />;
};

const MappedInputTextarea = (props) => {
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined') mappedProps.value = '';
    mappedProps.onChange = (e) => {
        props.onChange(e.target.value);
    };
    return <InputTextarea {...mappedProps} />;
};

const MappedDropdown = (props) => {
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined') mappedProps.value = '';
    mappedProps.onChange = (e) => {
        props.onChange(e.target.value);
    };
    mappedProps.optionLabel = 'text';
    return <Dropdown {...mappedProps} />;
};

const MappedCalendar = (props) => {
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined') mappedProps.value = '';
    mappedProps.onChange = (e) => {
        props.onChange(e.target.value);
    };
    mappedProps.showIcon = true;
    return <Calendar {...mappedProps} />;
};

const MappedCheckbox = (props) => {
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined') mappedProps.value = false;
    mappedProps.checked = !!mappedProps.value;
    mappedProps.onChange = (e) => {
        props.onChange(!!e.checked);
    };
    return <Checkbox {...mappedProps} />;
};

const MappedInputSwitch = (props) => {
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined') mappedProps.value = false;
    mappedProps.checked = !!mappedProps.value;
    mappedProps.onChange = (e) => {
        props.onChange(e.target.value);
    };
    return <InputSwitch {...mappedProps} />;
};

const primeFields = {
    text: {
        component: MappedInputText,
        isValid: () => true
    },
    textarea: {
        component: MappedInputTextarea,
        isValid: () => true
    },
    select: {
        component: MappedDropdown,
        isValid: () => true
    },
    calendar: {
        component: MappedCalendar,
        isValid: () => true
    },
    checkbox: {
        component: MappedCheckbox,
        isValid: () => true
    },
    switch: {
        component: MappedInputSwitch,
        isValid: () => true
    }
};

export default primeFields;