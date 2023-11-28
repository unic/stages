import { useState, useEffect } from 'react';
import { Form } from "react-stages";
import fieldProps from "./fieldProps";
import primeFields from './primeFields';
import { renderFields } from './helpers';

const FieldConfigEditor = ({ path, config, handleEditFieldConfig }) => {
    const [data, setData] = useState(config);

    useEffect(() => {
        setData(config);
    }, [config, path]);

    return (
        <>
            <code>{path}</code>
            <br /><br />
            {typeof config === "object" ? (
                <Form
                    key={`configForm-${config.type}`}
                    id={`configForm-${config.type}`}
                    data={data}
                    fields={primeFields}
                    config={{
                        fields: () => {
                            return fieldProps[config.type];
                        }
                    }}
                    render={({ actionProps, fieldProps }) => {
                        return (
                            <>
                                <form>
                                    <div style={{ position: "relative" }}>
                                        {renderFields(() => {}, () => {}, "", () => {}, null, () => {}, false, '', fieldProps, fieldProps.fields)}
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