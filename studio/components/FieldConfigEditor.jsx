import { useState, useEffect } from 'react';
import { Form } from "react-stages";
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import fieldProps from "./fieldProps";
import primeFields from './primeFields';
import { renderFields } from './helpers';

const InspectorSpacer = () => {
    return (
        <div style={{
            width: "100%",
            height: "1px",
            margin: "16px 0",
            backgroundColor: "#eee"
        }} />
    );
};

const parseConfig = config => {
    if (Array.isArray(config)) {
        return config.map(c => {
            return {...c, isInInspector: true};
        });
    }
    return config;
}

const FieldConfigEditor = ({ path, config, handleEditFieldConfig, doesPathExist }) => {
    if (!config) return null;
    
    const [data, setData] = useState(config);
    const [newId, setNewId] = useState(config.id);
    const [showIdEditDialog, setShowIdEditDialog] = useState(false);
    const actualConfig = parseConfig(fieldProps[config.type]);

    useEffect(() => {
        setData(config);
    }, [config, path]);

    const handleChangeId = () => {
        const newPath = path.indexOf(".") === -1 ? newId : path.split('.').slice(0,-1).join('.') + '.' + newId;
        if (newId && !doesPathExist(newPath)) {
            handleEditFieldConfig(path, {...data, id: newId});
            setShowIdEditDialog(false);
        }
    }

    console.log({ path, config, actualConfig });

    return (
        <>
            <div className="flex">
                <div className="flex-grow-1" style={{ paddingTop: "6px" }}><code>{path}</code></div>
                <div><Button label="Edit Field ID" outlined onClick={() => setShowIdEditDialog(true)} size="small" /></div>
            </div>
            <InspectorSpacer />
            <Dialog header="Header" visible={showIdEditDialog} style={{ width: '50vw' }} onHide={() => setShowIdEditDialog(false)} footer={(
                <Button label="Change" onClick={() => handleChangeId()} />
            )}>
                <p className="m-0">
                    Change id of field from <strong>{data.id}</strong> to <InputText value={newId} onChange={e => setNewId(e.target.value)} />
                </p>
                <p style={{ color: "red" }}>Note: The id has to be unique.</p>
            </Dialog>
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