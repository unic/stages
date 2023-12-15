import React, { useState, useEffect } from 'react';
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
import { parseTemplateLiterals } from './helpers';

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
    delete cleanedProps.isInInspector;
    return cleanedProps;
};

const InputWrapper = ({ children, id, label, isRequired, isDisabled, secondaryText, prefix, suffix, isInInspector, error, isValidating, errorRenderer }) => {
    const store = useStagesStore();

    useEffect(() => {
        useStagesStore.persist.rehydrate();
    }, []);

    if (isInInspector) {
        return (
            <div className="flex" style={isDisabled ? { opacity: 0.5, pointerEvents: "none", padding: 0 } : { padding: 0 }}>
                <div style={{ flexGrow: 1, minWidth: "140px", maxWidth: "140px" }}><label htmlFor={id}>{parseTemplateLiterals(label, store.data)}{isRequired ? " *" : ""}</label></div>
                <div>&nbsp;</div>
                <div style={{ minWidth: "204px", flexGrow: 1 }}><div className="p-inputgroup w-full">{children}</div></div>
            </div>
        );
    }
    return (
        <div className="field" style={isDisabled ? { opacity: 0.5, pointerEvents: "none", minWidth: !isInInspector ? "200px" : "auto", marginBottom: !isInInspector ? 0 : "16px"} : { minWidth: !isInInspector ? "200px" : "auto", marginBottom: !isInInspector ? 0 : "16px" }}>
            <label htmlFor={id} style={{ userSelect: store.isEditMode ? "none" : "auto" }}>{parseTemplateLiterals(label, store.data)}{isRequired ? " *" : ""}</label>
            {secondaryText ? <div style={{ margin: "-8px 0 8px 0", color: "#999" }}>{parseTemplateLiterals(secondaryText, store.data)}</div> : null}
            <div className="p-inputgroup w-full">
                {prefix && <span className="p-inputgroup-addon">{prefix}</span>}
                {children}
                {suffix && <span className="p-inputgroup-addon">{suffix}</span>}
            </div>
            {error && !isValidating ? errorRenderer ? errorRenderer(error) : (
                <div style={{ color: "red", fontSize: "14px", marginTop: "4px" }}>Please fill out this field!</div>
            ) : null}
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
    return (
        <InputWrapper 
            {...mappedProps}
            error={props.error}
            errorRenderer={props.errorRenderer}
            isValidating={props.isValidating}
            isRequired={props.isRequired}
            isDisabled={props.isDisabled}
            isInInspector={props.isInInspector}
        >
            <InputText {...mappedProps} className={props.error ? "p-invalid" : ""} tooltipOptions={{ position: props.isInInspector ? 'left' : 'right', showDelay: 500 }} />
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
    return <InputWrapper {...mappedProps} isRequired={props.isRequired} isDisabled={props.isDisabled} isInInspector={props.isInInspector} tooltipOptions={{ position: props.isInInspector ? 'left' : 'right', showDelay: 500 }}><InputText {...mappedProps} className={props.error ? "p-invalid" : ""} /></InputWrapper>;
};

const MappedInputMask = (props) => {
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined') mappedProps.value = '';
    mappedProps.type = 'text';
    mappedProps.onChange = (e) => {
        props.onChange(e.target.value);
    };
    return <InputWrapper {...mappedProps} isRequired={props.isRequired} isInInspector={props.isInInspector}><InputMask {...mappedProps} className={props.error ? "p-invalid" : ""} /></InputWrapper>;
};

const MappedInputTextarea = (props) => {
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined') mappedProps.value = '';
    mappedProps.onChange = (e) => {
        props.onChange(e.target.value);
    };
    return <InputWrapper {...mappedProps} isRequired={props.isRequired} isInInspector={props.isInInspector}><InputTextarea {...mappedProps} className={props.error ? "p-invalid" : ""} tooltipOptions={{ position: props.isInInspector ? 'left' : 'right', showDelay: 500 }} /></InputWrapper>;
};

const MappedEditor = (props) => {
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined') mappedProps.value = '';
    mappedProps.onChange = (e) => {
        props.onChange(e.target.value);
    };
    return <InputWrapper {...mappedProps} isRequired={props.isRequired} isInInspector={props.isInInspector}><Editor {...mappedProps} className={props.error ? "p-invalid" : ""} /></InputWrapper>;
};

const MappedDropdown = (props) => {
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined') mappedProps.value = '';
    mappedProps.onChange = (e) => {
        props.onChange(e.target.value);
    };
    mappedProps.optionLabel = 'text';
    return <InputWrapper {...mappedProps} isRequired={props.isRequired} isInInspector={props.isInInspector}><Dropdown {...mappedProps} className={props.error ? "p-invalid" : ""} /></InputWrapper>;
};

const MappedSelectButton = (props) => {
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined') mappedProps.value = '';
    mappedProps.onChange = (e) => {
        props.onChange(e.target.value);
    };
    mappedProps.optionLabel = 'text';
    return <InputWrapper {...mappedProps} isRequired={props.isRequired} isInInspector={props.isInInspector}><SelectButton {...mappedProps} className={props.error ? "p-invalid" : ""} /></InputWrapper>;
};

const MappedCalendar = (props) => {
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined') {
        mappedProps.value = '';
    } else {
        mappedProps.value = typeof mappedProps.value === 'string' ? new Date(mappedProps.value) : mappedProps.value;
    }
    mappedProps.onChange = (e) => {
        console.log({e});
        props.onChange(e.target.value);
    };
    mappedProps.showIcon = true;
    mappedProps.locale = "en";
    return <InputWrapper {...mappedProps} isRequired={props.isRequired} isInInspector={props.isInInspector}><Calendar {...mappedProps} className={props.error ? "p-invalid" : ""} /></InputWrapper>;
};

const MappedCheckbox = (props) => {
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined') mappedProps.value = false;
    mappedProps.checked = !!mappedProps.value;
    mappedProps.onChange = (e) => {
        props.onChange(!!e.checked);
    };
    return <InputWrapper {...mappedProps} isRequired={props.isRequired} isInInspector={props.isInInspector}><Checkbox {...mappedProps} className={props.error ? "p-invalid" : ""} /></InputWrapper>;
};

const MappedInputSwitch = (props) => {
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined') mappedProps.value = false;
    mappedProps.checked = !!mappedProps.value;
    mappedProps.onChange = (e) => {
        props.onChange(e.target.value);
    };
    return <InputWrapper {...mappedProps} isRequired={props.isRequired} isInInspector={props.isInInspector}><InputSwitch {...mappedProps} className={props.error ? "p-invalid" : ""} /></InputWrapper>;
};

const MappedToggleButton = (props) => {
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined') mappedProps.value = false;
    mappedProps.checked = !!mappedProps.value;
    mappedProps.onChange = (e) => {
        props.onChange(e.target.value);
    };
    return <InputWrapper {...mappedProps} isRequired={props.isRequired} isInInspector={props.isInInspector}><ToggleButton {...mappedProps} className={props.error ? "p-invalid" : ""} /></InputWrapper>;
};

const MappedRating = (props) => {
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined') mappedProps.value = '';
    mappedProps.type = 'text';
    mappedProps.onChange = (e) => {
        props.onChange(e.value);
    };
    return <InputWrapper {...mappedProps} isRequired={props.isRequired} isInInspector={props.isInInspector}><Rating {...mappedProps} className={props.error ? "p-invalid" : ""} /></InputWrapper>;
};

const MappedInputNumber = (props) => {
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined' || isNaN(mappedProps.value)) mappedProps.value = '';
    mappedProps.type = 'text';
    mappedProps.onChange = (e) => {
        props.onChange(e.value);
    };
    return <InputWrapper {...mappedProps} isRequired={props.isRequired} isInInspector={props.isInInspector}><InputNumber {...mappedProps} className={props.error ? "p-invalid" : ""} /></InputWrapper>;
};

const MappedSlider = (props) => {
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined') mappedProps.value = '';
    mappedProps.type = 'text';
    mappedProps.onChange = (e) => {
        props.onChange(e.value);
    };
    return <InputWrapper {...mappedProps} isRequired={props.isRequired} isInInspector={props.isInInspector}><Slider {...mappedProps} className={props.error ? "p-invalid" : ""} /></InputWrapper>;
};

const MappedChips = (props) => {
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined') mappedProps.value = '';
    mappedProps.onChange = (e) => {
        props.onChange(e.value);
    };
    return <InputWrapper {...mappedProps} isRequired={props.isRequired} isInInspector={props.isInInspector}><Chips {...mappedProps} className={props.error ? "p-invalid" : ""} /></InputWrapper>;
};

const MappedColorPicker = (props) => {
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined') mappedProps.value = 'ffffff';
    mappedProps.onChange = (e) => {
        props.onChange(e.value);
    };
    mappedProps.format = 'hex';
    return <InputWrapper {...mappedProps} isRequired={props.isRequired} isInInspector={props.isInInspector}><ColorPicker {...mappedProps} className={props.error ? "p-invalid" : ""} /></InputWrapper>;
};

const MappedPassword = (props) => {
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined') mappedProps.value = '';
    mappedProps.onChange = (e) => {
        props.onChange(e.target.value);
    };
    return <InputWrapper {...mappedProps} isRequired={props.isRequired} isInInspector={props.isInInspector}><Password {...mappedProps} className={props.error ? "p-invalid" : ""} /></InputWrapper>;
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