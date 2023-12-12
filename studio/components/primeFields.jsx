import React, { useState } from 'react';
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
import { Divider } from 'primereact/divider';
import useStagesStore from './store';

const isValid = (value, config) => {
    if (config.isRequired && (value === "" || typeof value === "undefined")) return false;
    return true;
};

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

const InputWrapper = ({ children, id, label, isRequired, isDisabled, secondaryText, isInInspector, error, isValidating, errorRenderer }) => {
    const store = useStagesStore();
    if (isInInspector) {
        return (
            <div className="flex" style={isDisabled ? { opacity: 0.5, pointerEvents: "none", padding: 0 } : { padding: 0 }}>
                <div style={{ flexGrow: 1 }}><label htmlFor={id}>{label}{isRequired ? " *" : ""}</label></div>
                <div>&nbsp;</div>
                <div style={{ minWidth: "202px", maxWidth: "202px" }}>{children}</div>
            </div>
        );
    }
    return (
        <div className="field" style={isDisabled ? { opacity: 0.5, pointerEvents: "none", minWidth: "200px", marginBottom: 0 } : { minWidth: "200px", marginBottom: 0 }}>
            <label htmlFor={id} style={{ userSelect: store.isEditMode ? "none" : "auto" }}>{label}{isRequired ? " *" : ""}</label>
            {secondaryText ? <div style={{ margin: "-8px 0 8px 0", color: "#999" }}>{secondaryText}</div> : null}
            <div className="w-full">{children}</div>
            {error && !isValidating ? errorRenderer ? errorRenderer(error) : (
                <div style={{ color: "red", fontSize: "14px", marginTop: "4px" }}>Please fill out this field!</div>
            ) : null}
        </div>
    );
};

const MappedInputText = (props) => {
    console.log({ props });
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined') mappedProps.value = '';
    mappedProps.type = 'text';
    mappedProps.onChange = (e) => {
        props.onChange(e.target.value);
    };
    return (
        <InputWrapper 
            {...mappedProps}
            error={props.error}
            errorRenderer={props.errorRenderer}
            isValidating={props.isValidating}
            isRequired={props.isRequired}
            isDisabled={props.isDisabled}
        >
            <InputText {...mappedProps} />
        </InputWrapper>
    );
};

const MappedInputTextBlur = (props) => {
    const [currentValue, setCurrentValue] = useState(props.value);
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined') mappedProps.value = '';
    mappedProps.type = 'text';
    mappedProps.onChange = (e) => {
        setCurrentValue(e.target.value);
    };
    mappedProps.onBlur = (e) => {
        props.onChange(currentValue);
        props.onBlur();
    };
    mappedProps.value = currentValue;
    return <InputWrapper {...mappedProps} isRequired={props.isRequired} isDisabled={props.isDisabled}><InputText {...mappedProps} /></InputWrapper>;
};

const MappedInputMask = (props) => {
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined') mappedProps.value = '';
    mappedProps.type = 'text';
    mappedProps.onChange = (e) => {
        props.onChange(e.target.value);
    };
    return <InputWrapper {...mappedProps} isRequired={props.isRequired}><InputMask {...mappedProps} /></InputWrapper>;
};

const MappedInputTextarea = (props) => {
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined') mappedProps.value = '';
    mappedProps.onChange = (e) => {
        props.onChange(e.target.value);
    };
    return <InputWrapper {...mappedProps} isRequired={props.isRequired}><InputTextarea {...mappedProps} /></InputWrapper>;
};

const MappedEditor = (props) => {
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined') mappedProps.value = '';
    mappedProps.onChange = (e) => {
        props.onChange(e.target.value);
    };
    return <InputWrapper {...mappedProps} isRequired={props.isRequired}><Editor {...mappedProps} /></InputWrapper>;
};

const MappedDropdown = (props) => {
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined') mappedProps.value = '';
    mappedProps.onChange = (e) => {
        props.onChange(e.target.value);
    };
    mappedProps.optionLabel = 'text';
    return <InputWrapper {...mappedProps} isRequired={props.isRequired}><Dropdown {...mappedProps} /></InputWrapper>;
};

const MappedSelectButton = (props) => {
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined') mappedProps.value = '';
    mappedProps.onChange = (e) => {
        props.onChange(e.target.value);
    };
    mappedProps.optionLabel = 'text';
    return <InputWrapper {...mappedProps} isRequired={props.isRequired}><SelectButton {...mappedProps} /></InputWrapper>;
};

const MappedCalendar = (props) => {
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined') {
        mappedProps.value = '';
    } else {
        mappedProps.value = typeof mappedProps.value === 'string' ? mappedProps.value : String(mappedProps.value);
    }
    mappedProps.onChange = (e) => {
        props.onChange(e.target.value);
    };
    mappedProps.showIcon = true;
    mappedProps.locale = "en";
    return <InputWrapper {...mappedProps} isRequired={props.isRequired}><Calendar {...mappedProps} /></InputWrapper>;
};

const MappedCheckbox = (props) => {
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined') mappedProps.value = false;
    mappedProps.checked = !!mappedProps.value;
    mappedProps.onChange = (e) => {
        props.onChange(!!e.checked);
    };
    return <InputWrapper {...mappedProps} isRequired={props.isRequired}><Checkbox {...mappedProps} /></InputWrapper>;
};

const MappedInputSwitch = (props) => {
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined') mappedProps.value = false;
    mappedProps.checked = !!mappedProps.value;
    mappedProps.onChange = (e) => {
        props.onChange(e.target.value);
    };
    return <InputWrapper {...mappedProps} isRequired={props.isRequired}><InputSwitch {...mappedProps} /></InputWrapper>;
};

const MappedToggleButton = (props) => {
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined') mappedProps.value = false;
    mappedProps.checked = !!mappedProps.value;
    mappedProps.onChange = (e) => {
        props.onChange(e.target.value);
    };
    return <InputWrapper {...mappedProps} isRequired={props.isRequired}><ToggleButton {...mappedProps} /></InputWrapper>;
};

const MappedRating = (props) => {
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined') mappedProps.value = '';
    mappedProps.type = 'text';
    mappedProps.onChange = (e) => {
        props.onChange(e.value);
    };
    return <InputWrapper {...mappedProps} isRequired={props.isRequired}><Rating {...mappedProps} /></InputWrapper>;
};

const MappedInputNumber = (props) => {
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined') mappedProps.value = '';
    mappedProps.type = 'text';
    mappedProps.onChange = (e) => {
        props.onChange(e.value);
    };
    return <InputWrapper {...mappedProps} isRequired={props.isRequired}><InputNumber {...mappedProps} /></InputWrapper>;
};

const MappedSlider = (props) => {
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined') mappedProps.value = '';
    mappedProps.type = 'text';
    mappedProps.onChange = (e) => {
        props.onChange(e.value);
    };
    return <InputWrapper {...mappedProps} isRequired={props.isRequired}><Slider {...mappedProps} /></InputWrapper>;
};

const MappedChips = (props) => {
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined') mappedProps.value = '';
    mappedProps.onChange = (e) => {
        props.onChange(e.value);
    };
    return <InputWrapper {...mappedProps} isRequired={props.isRequired}><Chips {...mappedProps} /></InputWrapper>;
};

const MappedColorPicker = (props) => {
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined') mappedProps.value = 'ffffff';
    mappedProps.onChange = (e) => {
        props.onChange(e.value);
    };
    mappedProps.format = 'hex';
    return <InputWrapper {...mappedProps} isRequired={props.isRequired}><ColorPicker {...mappedProps} /></InputWrapper>;
};

const MappedPassword = (props) => {
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined') mappedProps.value = '';
    mappedProps.onChange = (e) => {
        props.onChange(e.target.value);
    };
    return <InputWrapper {...mappedProps} isRequired={props.isRequired}><Password {...mappedProps} /></InputWrapper>;
};

const MappedDivider = (props) => {
    return <Divider type={props.borderType || "dashed"} layout={props.layout || "horizontal"} align={props.align}>{props.text}</Divider>;
};

const MappedHeading = (props) => {
    return (
        <div>
            {(!props.level || props.level === 2) && <h2 style={{ marginTop: 0 }}>{props.title}</h2>}
            {props.level === 3 && <h3 style={{ marginTop: 0 }}>{props.title}</h3>}
            {props.level === 4 && <h4 style={{ marginTop: 0 }}>{props.title}</h4>}
            {props.text && <p style={{ color: "#999", marginTop: "-12px", marginBottom: "4px" }}>{props.text}</p>}
        </div>
    );
};


const primeFields = {
    text: {
        component: MappedInputText,
        isValid: isValid
    },
    blurtext: {
        component: MappedInputTextBlur,
        isValid: isValid
    },
    number: {
        component: MappedInputNumber,
        isValid: isValid
    },
    slider: {
        component: MappedSlider,
        isValid: isValid
    },
    textarea: {
        component: MappedInputTextarea,
        isValid: isValid
    },
    editor: {
        component: MappedEditor,
        isValid: isValid
    },
    select: {
        component: MappedDropdown,
        isValid: isValid
    },
    calendar: {
        component: MappedCalendar,
        isValid: isValid
    },
    checkbox: {
        component: MappedCheckbox,
        isValid: isValid
    },
    switch: {
        component: MappedInputSwitch,
        isValid: isValid
    },
    toggle: {
        component: MappedToggleButton,
        isValid: isValid
    },
    rating: {
        component: MappedRating,
        isValid: isValid
    },
    buttons: {
        component: MappedSelectButton,
        isValid: isValid
    },
    chips: {
        component: MappedChips,
        isValid: isValid
    },
    color: {
        component: MappedColorPicker,
        isValid: isValid
    },
    mask: {
        component: MappedInputMask,
        isValid: isValid
    },
    password: {
        component: MappedPassword,
        isValid: isValid
    },
    divider: {
        component: MappedDivider,
        isValid: () => true
    },
    heading: {
        component: MappedHeading,
        isValid: () => true
    }
};

export default primeFields;