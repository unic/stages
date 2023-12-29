import _ from "lodash";
import { Button } from 'primereact/button';
import GeneralConfig from './GeneralConfig';
import DataInspector from './DataInspector';
import InspectorHeader from './InspectorHeader';
import { GitFork } from 'lucide-react';
import FieldConfigEditor from './FieldConfigEditor';
import { TabMenu } from 'primereact/tabmenu';
import { ScrollPanel } from 'primereact/scrollpanel';
import useStagesStore from './store';
import { getConfigPathFromDataPath, downloadFile } from './helpers';

const SidePanel = () => {
    const store = useStagesStore();

    const handleEditFieldConfig = (path, config) => {
        console.log("--> handleEditFieldConfig <--", {path, config});
        if (Array.isArray(path)) {
            const newConfig = [...store.currentConfig];
            path.forEach(p => {
                // p = path, config = diff 
                const realPath = getConfigPathFromDataPath(p, newConfig);
                if (realPath && config.length > 0) {
                    const editedConfig = _.get(store.currentConfig, realPath);
                    config.forEach(c => {
                        editedConfig[c[0]] = c[1];
                    });
                    _.set(newConfig, realPath, editedConfig);
                }
            });
            store.updateCurrentConfig(newConfig);
        } else {
            if (!config.id) return;
            const newConfig = [...store.currentConfig];
            const realPath = getConfigPathFromDataPath(path, newConfig);
            if (realPath && Object.keys(config).length > 0) {
                const oldConfig = _.get(store.currentConfig, realPath);
                if (config.type === "group" || config.type === "collection" || config.type === "wizard") {
                    _.set(newConfig, realPath, {...config, fields: config.fields});
                } else {
                    _.set(newConfig, realPath, config);
                }
                if (oldConfig.id !== config.id && config.id && oldConfig.id) store.setSelectedElement(config.id);
            }
            console.log({realPath, newConfig});
            store.updateCurrentConfig(newConfig);
            store.setEditorTabIndex(1);
        }
    };

    const handleExportToJson = e => {
        e.preventDefault();
        downloadFile({
            data: JSON.stringify(store.currentConfig),
            fileName: 'stages-config.json',
            fileType: 'text/json',
        })
    }

    const getSelectedConfig = (config, selectedElement) => {
        if (Array.isArray(selectedElement)) {
            return selectedElement.map(item => _.get(config, getConfigPathFromDataPath(item, config))).filter(item => item);
        } else {
            // If selected element starts with curly braces, it's a fieldset: {passwords}.fieldid
            if (typeof store.selectedElement === "string" && store.selectedElement.startsWith("{")) {
                const pathSplit = store.selectedElement.substring(1).split("}");
                const fieldSetConfig = _.find(store.fieldsets, { id: pathSplit[0] });
                if (fieldSetConfig) {
                    let tempConfig = _.get(fieldSetConfig.config, getConfigPathFromDataPath(pathSplit[0], fieldSetConfig.config));
                    if (Array.isArray(tempConfig)) tempConfig = tempConfig.filter(item => item);
                    return tempConfig;
                }
            } else {
                let tempConfig = _.get(config, getConfigPathFromDataPath(selectedElement, config));
                if (Array.isArray(tempConfig)) tempConfig = tempConfig.filter(item => item);
                return tempConfig;
            }
        }
        return null;
    };

    return (
        <div style={{ width: "100%", minWidth: "393px", height: '100vh', backgroundColor: "#FCFCFC", boxShadow: "0px 0px 32px 0px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", flexDirection: "column", height: "100%" }}>
                <InspectorHeader />
                <div style={{ backgroundColor: "#fff", padding: "0 12px 0 12px" }}>
                    <TabMenu model={[
                        {label: 'General Config'},
                        {label: 'Inspector'},
                        {label: 'Data'}
                    ]} activeIndex={store.editorTabIndex} onTabChange={(e) => store.setEditorTabIndex(e.index)} />
                </div>
                <ScrollPanel style={{ height: "calc(100vh - 320px)", flexGrow: 1 }}>
                    <div style={{ padding: "16px 12px" }}>
                        {store.editorTabIndex === 1 ? (
                            <FieldConfigEditor
                                key={store.selectedElement}
                                path={store.selectedElement}
                                isFieldsetItem={typeof store.selectedElement === "string" && store.selectedElement.startsWith("{")}
                                config={getSelectedConfig(store.currentConfig, store.selectedElement)}
                                handleEditFieldConfig={handleEditFieldConfig}
                            />
                        ) : null}
                        {store.editorTabIndex === 0 ? <GeneralConfig /> : null}
                        {store.editorTabIndex === 2 ? <DataInspector /> : null}
                    </div>
                </ScrollPanel>
                <div style={{ backgroundColor: "#fff", padding: "16px 12px", borderTop: "1px #EAEAEA solid", display: "flex", justifyContent: "space-between" }}>
                    <div style={{ paddingTop: "4px" }}><GitFork color="#000" size={16} /></div>
                    <div>
                    <Button link severity="secondary" onClick={handleExportToJson} style={{ padding: 0, fontSize: "14px" }}>
                        Export Config
                    </Button>
                    </div>
                    <div style={{ fontSize: "12px", color: "#999", paddingTop: "6px" }}>v 2023-03-27 16:11</div>
                </div>
            </div>
        </div>
    );
};

export default SidePanel;