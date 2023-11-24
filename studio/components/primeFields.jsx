import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Checkbox } from 'primereact/checkbox';
import { InputSwitch } from 'primereact/inputswitch';
import { InputNumber } from 'primereact/inputnumber';
import { Rating } from 'primereact/rating';
import { SelectButton } from 'primereact/selectbutton';
import { Slider } from 'primereact/slider';
import { ToggleButton } from 'primereact/togglebutton';
import { Editor } from 'primereact/editor';
import { Chips } from 'primereact/chips';
import { ColorPicker } from 'primereact/colorpicker';
import { InputMask } from 'primereact/inputmask';
import { Password } from 'primereact/password';

const removeStagesProps = (props) => {
    const cleanedProps = { ...props };
    cleanedProps.disabled = cleanedProps.isDisabled;
    cleanedProps.error =
        cleanedProps.error && cleanedProps.errorRenderer
        ? typeof cleanedProps.errorRenderer === 'function'
            ? cleanedProps.errorRenderer(cleanedProps.error, props)
            : cleanedProps.errorRenderer
        : cleanedProps.error;
    delete cleanedProps.customValidation;
    delete cleanedProps.errorRenderer;
    delete cleanedProps.validateOn;
    delete cleanedProps.initialValue;
    delete cleanedProps.isRequired;
    delete cleanedProps.isDisabled;
    delete cleanedProps.isDirty;
    delete cleanedProps.hasFocus;
    delete cleanedProps.regexValidation;
    return cleanedProps;
};

const InputWrapper = ({ children, id, label, isRequired, isDisabled, secondaryText }) => {
    return (
        <div className="field" style={isDisabled ? { opacity: 0.5, pointerEvents: "none" } : {}}>
            <label htmlFor={id}>{label}{isRequired ? " *" : ""}</label>
            {secondaryText ? <p className="w-full">{secondaryText}</p> : null}
            <div className="w-full">{children}</div>
        </div>
    );
};

const MappedInputText = (props) => {
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined') mappedProps.value = '';
    mappedProps.type = 'text';
    mappedProps.onChange = (e) => {
        props.onChange(e.target.value);
    };
    return <InputWrapper {...mappedProps} isRequired={props.isRequired} isDisabled={props.isDisabled}><InputText {...mappedProps} /></InputWrapper>;
};

const MappedInputMask = (props) => {
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined') mappedProps.value = '';
    mappedProps.type = 'text';
    mappedProps.onChange = (e) => {
        props.onChange(e.target.value);
    };
    return <InputWrapper {...mappedProps}><InputMask {...mappedProps} /></InputWrapper>;
};

const MappedInputTextarea = (props) => {
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined') mappedProps.value = '';
    mappedProps.onChange = (e) => {
        props.onChange(e.target.value);
    };
    return <InputWrapper {...mappedProps}><InputTextarea {...mappedProps} /></InputWrapper>;
};

const MappedEditor = (props) => {
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined') mappedProps.value = '';
    mappedProps.onChange = (e) => {
        props.onChange(e.target.value);
    };
    return <InputWrapper {...mappedProps}><Editor {...mappedProps} /></InputWrapper>;
};

const MappedDropdown = (props) => {
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined') mappedProps.value = '';
    mappedProps.onChange = (e) => {
        props.onChange(e.target.value);
    };
    mappedProps.optionLabel = 'text';
    return <InputWrapper {...mappedProps}><Dropdown {...mappedProps} /></InputWrapper>;
};

const MappedSelectButton = (props) => {
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined') mappedProps.value = '';
    mappedProps.onChange = (e) => {
        props.onChange(e.target.value);
    };
    mappedProps.optionLabel = 'text';
    return <InputWrapper {...mappedProps}><SelectButton {...mappedProps} /></InputWrapper>;
};

const MappedCalendar = (props) => {
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined') mappedProps.value = '';
    mappedProps.onChange = (e) => {
        props.onChange(e.target.value);
    };
    mappedProps.showIcon = true;
    mappedProps.locale = "en";
    return <InputWrapper {...mappedProps}><Calendar {...mappedProps} /></InputWrapper>;
};

const MappedCheckbox = (props) => {
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined') mappedProps.value = false;
    mappedProps.checked = !!mappedProps.value;
    mappedProps.onChange = (e) => {
        props.onChange(!!e.checked);
    };
    return <InputWrapper {...mappedProps}><Checkbox {...mappedProps} /></InputWrapper>;
};

const MappedInputSwitch = (props) => {
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined') mappedProps.value = false;
    mappedProps.checked = !!mappedProps.value;
    mappedProps.onChange = (e) => {
        props.onChange(e.target.value);
    };
    return <InputWrapper {...mappedProps}><InputSwitch {...mappedProps} /></InputWrapper>;
};

const MappedToggleButton = (props) => {
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined') mappedProps.value = false;
    mappedProps.checked = !!mappedProps.value;
    mappedProps.onChange = (e) => {
        props.onChange(e.target.value);
    };
    return <InputWrapper {...mappedProps}><ToggleButton {...mappedProps} /></InputWrapper>;
};

const MappedRating = (props) => {
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined') mappedProps.value = '';
    mappedProps.type = 'text';
    mappedProps.onChange = (e) => {
        props.onChange(e.value);
    };
    return <InputWrapper {...mappedProps}><Rating {...mappedProps} /></InputWrapper>;
};

const MappedInputNumber = (props) => {
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined') mappedProps.value = '';
    mappedProps.type = 'text';
    mappedProps.onChange = (e) => {
        props.onChange(e.value);
    };
    return <InputWrapper {...mappedProps}><InputNumber {...mappedProps} /></InputWrapper>;
};

const MappedSlider = (props) => {
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined') mappedProps.value = '';
    mappedProps.type = 'text';
    mappedProps.onChange = (e) => {
        props.onChange(e.value);
    };
    return <InputWrapper {...mappedProps}><Slider {...mappedProps} /></InputWrapper>;
};

const MappedChips = (props) => {
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined') mappedProps.value = '';
    mappedProps.onChange = (e) => {
        props.onChange(e.value);
    };
    return <InputWrapper {...mappedProps}><Chips {...mappedProps} /></InputWrapper>;
};

const MappedColorPicker = (props) => {
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined') mappedProps.value = 'ffffff';
    mappedProps.onChange = (e) => {
        props.onChange(e.value);
    };
    mappedProps.format = 'hex';
    return <InputWrapper {...mappedProps}><ColorPicker {...mappedProps} /></InputWrapper>;
};

const MappedPassword = (props) => {
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined') mappedProps.value = '';
    mappedProps.onChange = (e) => {
        props.onChange(e.target.value);
    };
    return <InputWrapper {...mappedProps}><Password {...mappedProps} /></InputWrapper>;
};

const primeFields = {
    text: {
        component: MappedInputText,
        isValid: () => true
    },
    number: {
        component: MappedInputNumber,
        isValid: () => true
    },
    slider: {
        component: MappedSlider,
        isValid: () => true
    },
    textarea: {
        component: MappedInputTextarea,
        isValid: () => true
    },
    editor: {
        component: MappedEditor,
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
    },
    toggle: {
        component: MappedToggleButton,
        isValid: () => true
    },
    rating: {
        component: MappedRating,
        isValid: () => true
    },
    buttons: {
        component: MappedSelectButton,
        isValid: () => true
    },
    chips: {
        component: MappedChips,
        isValid: () => true
    },
    color: {
        component: MappedColorPicker,
        isValid: () => true
    },
    mask: {
        component: MappedInputMask,
        isValid: () => true
    },
    password: {
        component: MappedPassword,
        isValid: () => true
    }
};

export default primeFields;