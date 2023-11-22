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

const MappedInputMask = (props) => {
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined') mappedProps.value = '';
    mappedProps.type = 'text';
    mappedProps.onChange = (e) => {
        props.onChange(e.target.value);
    };
    return <InputMask {...mappedProps} />;
};

const MappedInputTextarea = (props) => {
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined') mappedProps.value = '';
    mappedProps.onChange = (e) => {
        props.onChange(e.target.value);
    };
    return <InputTextarea {...mappedProps} />;
};

const MappedEditor = (props) => {
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined') mappedProps.value = '';
    mappedProps.onChange = (e) => {
        props.onChange(e.target.value);
    };
    return <Editor {...mappedProps} />;
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

const MappedSelectButton = (props) => {
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined') mappedProps.value = '';
    mappedProps.onChange = (e) => {
        props.onChange(e.target.value);
    };
    mappedProps.optionLabel = 'text';
    return <SelectButton {...mappedProps} />;
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

const MappedToggleButton = (props) => {
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined') mappedProps.value = false;
    mappedProps.checked = !!mappedProps.value;
    mappedProps.onChange = (e) => {
        props.onChange(e.target.value);
    };
    return <ToggleButton {...mappedProps} />;
};

const MappedRating = (props) => {
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined') mappedProps.value = '';
    mappedProps.type = 'text';
    mappedProps.onChange = (e) => {
        props.onChange(e.value);
    };
    return <Rating {...mappedProps} />;
};

const MappedInputNumber = (props) => {
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined') mappedProps.value = '';
    mappedProps.type = 'text';
    mappedProps.onChange = (e) => {
        props.onChange(e.value);
    };
    return <InputNumber {...mappedProps} />;
};

const MappedSlider = (props) => {
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined') mappedProps.value = '';
    mappedProps.type = 'text';
    mappedProps.onChange = (e) => {
        props.onChange(e.value);
    };
    return <Slider {...mappedProps} />;
};

const MappedChips = (props) => {
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined') mappedProps.value = '';
    mappedProps.onChange = (e) => {
        props.onChange(e.value);
    };
    return <Chips {...mappedProps} />;
};

const MappedColorPicker = (props) => {
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined') mappedProps.value = 'ffffff';
    mappedProps.onChange = (e) => {
        props.onChange(e.value);
    };
    mappedProps.format = 'hex';
    return <ColorPicker {...mappedProps} />;
};

const MappedPassword = (props) => {
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined') mappedProps.value = '';
    mappedProps.onChange = (e) => {
        props.onChange(e.target.value);
    };
    return <Password {...mappedProps} />;
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