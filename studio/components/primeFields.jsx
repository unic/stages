import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';

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
};

export default primeFields;