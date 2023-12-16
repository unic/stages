import { useState, useEffect } from 'react';
import { Form } from "react-stages";
import { Message } from 'primereact/message';
import fieldProps from "./fieldProps";
import primeFields from './primeFields';
import { FieldRenderer } from './FieldRenderer';
import FormattedPath from './FormattedPath';
import _ from "lodash";

const parseConfig = config => {
    if (Array.isArray(config)) {
        return config.map(c => {
            return {...c, isInInspector: true};
        });
    }
    return config;
}

const getSameProperties = configs => {
    const parsedConfigs = configs.map(c => {
        return parseConfig(fieldProps[c.type]);
    });
    const ids = {};
    const properties = [];
    parsedConfigs.forEach(c => {
        c.forEach(p => {
            if (!ids[p.id]) ids[p.id] = [];
            ids[p.id].push(c);
        });
    });
    Object.keys(ids).forEach(id => {
        if (ids[id].length === configs.length && id !== "id") {
            properties.push(id);
        }
    });
    return properties.map(p => _.find(parsedConfigs[0], {id: p}));
};

const allEqual = arr => arr.every( v => v === arr[0] );

const getSameData = configs => {
    const data = {};
    configs.forEach(c => {
        Object.keys(c).forEach(p => {
            if (!data[p]) data[p] = [];
            data[p].push(c[p]);
        });
    });
    const finalData = {};
    Object.keys(data).map(d => {
        if (allEqual(data[d]) && data[d].length === configs.length) finalData[d] = data[d][0];
    });
    return finalData;
};

const FieldConfigEditor = ({ path, config, handleEditFieldConfig }) => {
    if (!config || (typeof config !== "object" && !Array.isArray(config)) || !path) {
        return <Message severity="info" text="Select field, group or collection to edit its configuration." />;
    }

    const actualConfig = Array.isArray(config) ? getSameProperties(config) : parseConfig(fieldProps[config.type]);
    const [data, setData] = useState(Array.isArray(config) ? getSameData(config) : config);

    useEffect(() => {
        setData(Array.isArray(config) ? getSameData(config) : config);
    }, [config, path]);

    return (
        <>
            <div className="flex">
                <div className="flex-grow-1" style={{ paddingTop: "6px" }}>
                    {Array.isArray(path) ? path.map((p, i) => <FormattedPath key={i} path={p} />) : <FormattedPath path={path} />}
                </div>
            </div>
            {Array.isArray(actualConfig) ? (
                <Form
                    key={`configForm-${typeof config === "object" ? config.type : "multiselect"}`}
                    id={`configForm-${typeof config === "object" ? config.type : "multiselect"}`}
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
                        if (!Array.isArray(config)) {
                            setData(payload);
                            handleEditFieldConfig(path, payload);
                        } else {
                            // Multiple fields are selected, so change all fields if there is an actualy data change
                            // Find out what has changed and than apply that to all paths
                            const diff = _.differenceWith(_.toPairs(payload), _.toPairs(data), _.isEqual);
                            setData(payload);
                            handleEditFieldConfig(path, diff);
                        }
                    }}
                />
            ) : null}
        </>
    );
};

export default FieldConfigEditor;