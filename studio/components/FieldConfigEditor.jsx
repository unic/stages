import { useState, useEffect } from 'react';
import { Form } from "react-stages";
import { Message } from 'primereact/message';
import fieldProps from "./fieldProps";
import primeFields from './primeFields';
import { FieldRenderer } from './FieldRenderer';
import useStagesStore from './store';
import InspectorSpacer from './InspectorSpacer';
import FormattedPath from './FormattedPath';

const parseConfig = config => {
    if (Array.isArray(config)) {
        return config.map(c => {
            return {...c, isInInspector: true};
        });
    }
    return config;
}

const FieldConfigEditor = ({ path, config, handleEditFieldConfig }) => {
    if (!config || typeof config !== "object" || !path) {
        return <Message severity="info" text="Select field, group or collection to edit its configuration." />;
    }

    const store = useStagesStore();
    const [data, setData] = useState(config);
    const actualConfig = parseConfig(fieldProps[config.type]);

    useEffect(() => {
        setData(config);
    }, [config, path]);

    return (
        <>
            <div className="flex">
                <div className="flex-grow-1" style={{ paddingTop: "6px" }}>
                    <FormattedPath path={path} />
                </div>
            </div>
            <InspectorSpacer />
            {typeof config === "object" ? (
                <Form
                    key={`configForm-${config.type}`}
                    id={`configForm-${config.type}`}
                    data={data}
                    fields={primeFields}
                    config={{
                        fields: () => {
                            return actualConfig;
                        }
                    }}
                    render={({ actionProps, fieldProps }) => {
                        return (
                            <>
                                <form>
                                    <div style={{ position: "relative", margin: "-8px" }}>
                                        <FieldRenderer
                                            parent=""
                                            fieldProps={fieldProps}
                                            fields={fieldProps.fields}
                                            isFieldConfigEditor
                                        />
                                    </div>
                                </form>
                            </>
                        );
                    }}
                    onChange={payload => {
                        setData(payload);
                        handleEditFieldConfig(path, payload);
                    }}
                />
            ) : null}
        </>
    );
};

export default FieldConfigEditor;