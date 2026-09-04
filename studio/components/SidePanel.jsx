import _ from "lodash";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import GeneralConfig from "./GeneralConfig";
import DataInspector from "./DataInspector";
import InspectorHeader from "./InspectorHeader";
import { GitFork } from "lucide-react";
import FieldConfigEditor from "./FieldConfigEditor";
import useStagesStore from "./store";
import { getConfigPathFromDataPath, downloadFile } from "./helpers";
import { useShallow } from "zustand/react/shallow";

const SidePanel = () => {
  const store = useStagesStore(useShallow((state) => ({
    currentConfig: state.currentConfig,
    editorTabIndex: state.editorTabIndex,
    fieldsets: state.fieldsets,
    selectedElement: state.selectedElement,
    setEditorTabIndex: state.setEditorTabIndex,
    setSelectedElement: state.setSelectedElement,
    updateCurrentConfig: state.updateCurrentConfig,
    updateFieldsetConfig: state.updateFieldsetConfig,
  })));

  const handleEditFieldConfig = (path, config, isFieldsetItem) => {
    if (Array.isArray(path)) {
      const newConfig = isFieldsetItem ? _.cloneDeep(config) : _.cloneDeep(store.currentConfig);
      path.forEach((p) => {
        // p = path, config = diff
        const realPath = getConfigPathFromDataPath(p, newConfig);
        if (realPath && config.length > 0) {
          const editedConfig = _.get(
            isFieldsetItem ? config : store.currentConfig,
            realPath
          );
          config.forEach((c) => {
            editedConfig[c[0]] = c[1];
          });
          _.set(newConfig, realPath, editedConfig);
        }
      });
      if (isFieldsetItem) {
        store.updateFieldsetConfig(newConfig, config.id);
      } else {
        store.updateCurrentConfig(newConfig);
      }
    } else {
      if (!config.id) return;
      const fieldset = isFieldsetItem
        ? _.find(store.fieldsets, {
            id: path.slice(path.indexOf("{") + 1, path.indexOf("}")),
          })
        : {};
      const newConfig = isFieldsetItem
        ? _.cloneDeep(fieldset.config)
        : _.cloneDeep(store.currentConfig);
      const realPath = getConfigPathFromDataPath(path, newConfig);
      if (realPath && Object.keys(config).length > 0) {
        const oldConfig = _.get(
          isFieldsetItem ? fieldset.config : store.currentConfig,
          realPath
        );
        if (
          config.type === "group" ||
          config.type === "collection" ||
          config.type === "wizard"
        ) {
          _.set(newConfig, realPath, { ...config, fields: config.fields });
        } else {
          _.set(newConfig, realPath, config);
        }
        if (oldConfig.id !== config.id && config.id && oldConfig.id)
          store.setSelectedElement(config.id);
      }
      if (isFieldsetItem) {
        store.updateFieldsetConfig(newConfig, config.id);
      } else {
        store.updateCurrentConfig(newConfig);
      }
      store.setEditorTabIndex(1);
    }
  };

  const handleExportToJson = (e) => {
    e.preventDefault();
    downloadFile({
      data: JSON.stringify(store.currentConfig, null, 2),
      fileName: "stages-config.json",
      fileType: "text/json",
    });
  };

  return (
    <div
      style={{
        width: "100%",
        minWidth: "393px",
        height: "100vh",
        backgroundColor: "#FCFCFC",
        boxShadow: "0px 0px 32px 0px rgba(0,0,0,0.2)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          flexDirection: "column",
          height: "100%",
        }}
      >
        <InspectorHeader />
        <div style={{ backgroundColor: "#fff", padding: "0" }}>
          <Tabs value={String(store.editorTabIndex)} onValueChange={(value) => store.setEditorTabIndex(Number(value))}>
            <TabsList aria-label="Editor panels">
              <TabsTrigger value="0">General</TabsTrigger>
              <TabsTrigger value="1">Inspector</TabsTrigger>
              <TabsTrigger value="2">Data</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <ScrollArea style={{ height: "calc(100vh - 320px)", flexGrow: 1 }}>
          <div style={{ padding: "16px 12px" }}>
            {store.editorTabIndex === 1 ? (
              <FieldConfigEditor
                key={store.selectedElement}
                handleEditFieldConfig={handleEditFieldConfig}
              />
            ) : null}
            {store.editorTabIndex === 0 ? <GeneralConfig /> : null}
            {store.editorTabIndex === 2 ? <DataInspector /> : null}
          </div>
        </ScrollArea>
        <div
          style={{
            backgroundColor: "#fff",
            padding: "16px 12px",
            borderTop: "1px #EAEAEA solid",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <div style={{ paddingTop: "4px" }}>
            <GitFork color="#000" size={16} />
          </div>
          <div>
            <Button
              variant="link"
              onClick={handleExportToJson}
              style={{ padding: 0, fontSize: "14px" }}
            >
              Export Config
            </Button>
          </div>
          <div style={{ fontSize: "12px", color: "#999", paddingTop: "6px" }}>
            v 2023-03-27 16:11
          </div>
        </div>
      </div>
    </div>
  );
};

export default SidePanel;
