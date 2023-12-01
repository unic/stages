import { useState, useEffect } from 'react';
import { Form } from "react-stages";
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import fieldProps from "./fieldProps";
import primeFields from './primeFields';
import { renderFields } from './helpers';

const FieldConfigEditor = ({ path, config, handleEditFieldConfig, doesPathExist }) => {
    if (!config) return null;
    
    const [data, setData] = useState(config);
    const [newId, setNewId] = useState(config.id);
    const [showIdEditDialog, setShowIdEditDialog] = useState(false);

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

    return (
        <>
            <code>{path} <Button label="Edit ID" onClick={() => setShowIdEditDialog(true)} size="small" /></code>
            <Dialog header="Header" visible={showIdEditDialog} style={{ width: '50vw' }} onHide={() => setShowIdEditDialog(false)} footer={(
                <Button label="Change" onClick={() => handleChangeId()} />
            )}>
                <p className="m-0">
                    Change id of field from <strong>{data.id}</strong> to <InputText value={newId} onChange={e => setNewId(e.target.value)} />
                </p>
                <p style={{ color: "red" }}>Note: The id has to be unique.</p>
            </Dialog>
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