import React, { useState, useEffect, useCallback } from 'react';
import sanitizeHtml from "sanitize-html";
import _ from "lodash";
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
import { MultiSelect } from 'primereact/multiselect';
import { Message } from 'primereact/message';
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
    delete cleanedProps.blockWidth;
    return cleanedProps;
};

const InputWrapper = ({ children, id, label, isRequired, isDisabled, secondaryText, prefix, suffix, isInInspector, error, isValidating, errorRenderer }) => {
    const store = useStagesStore();
    const [labelText, setLabelText] = React.useState(parseTemplateLiterals(label, store.data));

    useEffect(() => {
        useStagesStore.persist.rehydrate();
    }, []);

    useEffect(() => {
        setLabelText(parseTemplateLiterals(label, store.data));
    }, [label]);

    const handleEditLabel = useCallback(evt => {
        const sanitizeConf = {
            allowedTags: [],
            allowedAttributes: {}
        };
        const newLabel = sanitizeHtml(evt.currentTarget.innerHTML, sanitizeConf);
        setLabelText(newLabel);
        store.onUpdateLabel(id, newLabel);
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
        <div className="field" style={isDisabled ? { opacity: 0.5, minWidth: "auto", marginBottom: 0} : { minWidth: "auto", marginBottom: 0 }}>
            <label htmlFor={id} style={{ userSelect: store.isEditMode ? "none" : "auto", cursor: "text" }}>
                <span contentEditable dangerouslySetInnerHTML={{__html: labelText}} onClick={(e) => e.preventDefault()} onBlur={handleEditLabel} />{isRequired ? " *" : ""}
            </label>
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
    return <InputWrapper {...mappedProps} isRequired={props.isRequired} isInInspector={props.isInInspector}>
        <div style={{ overflow: "hidden", width: "100%" }}><Editor {...mappedProps} className={props.error ? "p-invalid" : ""} /></div>
    </InputWrapper>;
};

const MappedDropdown = (props) => {
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined') mappedProps.value = '';
    mappedProps.onChange = (e) => {
        props.onChange(e.target.value);
    };
    mappedProps.optionLabel = 'text';
    return <InputWrapper {...mappedProps} isRequired={props.isRequired} isInInspector={props.isInInspector}><Dropdown {...mappedProps} filter={props.showFilter || false} className={props.error ? "p-invalid" : ""} /></InputWrapper>;
};

const MappedMultiSelect = (props) => {
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined') mappedProps.value = [];
    mappedProps.onChange = (e) => {
        props.onChange(e.target.value);
    };
    mappedProps.optionLabel = 'text';
    return <InputWrapper {...mappedProps} isRequired={props.isRequired} isInInspector={props.isInInspector}><MultiSelect {...mappedProps} filter={props.showFilter || false} className={props.error ? "p-invalid" : ""} /></InputWrapper>;
};

const MappedSelectButton = (props) => {
    const mappedProps = removeStagesProps(props);
    if (typeof mappedProps.value === 'undefined') mappedProps.value = mappedProps.defaultValue || '';
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
        props.onChange(e.target.value);
    };
    mappedProps.showIcon = true;
    mappedProps.locale = "en";
    return <InputWrapper {...mappedProps} isRequired={props.isRequired} isInInspector={props.isInInspector}><Calendar {...mappedProps} className={props.error ? "p-invalid" : ""} /></InputWrapper>;
};

const MappedCheckbox = (props) => {
    const mappedProps = removeStagesProps(props);
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
    if (typeof mappedProps.value === 'undefined' || isNaN(mappedProps.value)) mappedProps.value = 0;
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
    return <Divider pt={props.isInInspector ? { root: { style: { margin: "8px 0" } }, content: { style: { backgroundColor: "#fcfcfc" } } } : {}} type={props.borderType || props.isInInspector ? "solid" : "dashed"} layout={props.layout || "horizontal"} align={props.align || "center"}>
        {props.text && <span style={{ color: "#999", fontSize: "12px" }}>{props.text}</span>}
    </Divider>;
};

const MappedHeading = (props) => {
    const store = useStagesStore();
    return (
        <div>
            {(!props.level || props.level === 2) && <h2 style={{ marginTop: 0 }}>{parseTemplateLiterals(props.title, store.data)}</h2>}
            {props.level === 3 && <h3 style={{ marginTop: 0 }}>{parseTemplateLiterals(props.title, store.data)}</h3>}
            {props.level === 4 && <h4 style={{ marginTop: 0 }}>{parseTemplateLiterals(props.title, store.data)}</h4>}
            {props.text && <p style={{ color: "#999", marginTop: "-12px", marginBottom: "4px" }}>{parseTemplateLiterals(props.text, store.data)}</p>}
        </div>
    );
};

const MappedMessage = (props) => {
    return (
        <Message text={props.text} severity={props.severity} />
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
    },
    multiselect: {
        component: MappedMultiSelect,
        isValid: isValid
    },
    message: {
        component: MappedMessage,
        isValid: isValid
    }
};

export default primeFields;