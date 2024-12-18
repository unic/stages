import { useState } from "react";
import { Form } from "react-stages";
import { Message } from "primereact/message";
import { Waypoints } from "lucide-react";
import fieldProps from "./fieldProps";
import primeFields from "./primeFields";
import { FieldRenderer } from "./FieldRenderer";
import FormattedPath from "./FormattedPath";
import useStagesStore from "./store";
import InspectorSpacer from "./InspectorSpacer";
import {
  getConfigPathFromDataPath,
  removeNonMatchingProperties,
} from "./helpers";
import _ from "lodash";

const parseConfig = (config) => {
  if (Array.isArray(config)) {
    return config.map((c) => {
      return { ...c, isInInspector: true };
    });
  }
  return config;
};

const getSameProperties = (configs) => {
  const parsedConfigs = configs.map((c) => {
    return parseConfig(fieldProps[c.type]);
  });
  const ids = {};
  const properties = [];
  parsedConfigs.forEach((c) => {
    c.forEach((p) => {
      if (!ids[p.id]) ids[p.id] = [];
      ids[p.id].push(c);
    });
  });
  Object.keys(ids).forEach((id) => {
    if (ids[id].length === configs.length && id !== "id") {
      properties.push(id);
    }
  });
  return properties.map((p) => _.find(parsedConfigs[0], { id: p }));
};

const allEqual = (arr) => arr.every((v) => v === arr[0]);

const getSameData = (configs) => {
  const data = {};
  configs.forEach((c) => {
    Object.keys(c).forEach((p) => {
      if (!data[p]) data[p] = [];
      data[p].push(c[p]);
    });
  });
  const finalData = {};
  Object.keys(data).map((d) => {
    if (allEqual(data[d]) && data[d].length === configs.length)
      finalData[d] = data[d][0];
  });
  return finalData;
};

const getSelectedConfig = (config, selectedElement, store) => {
  if (Array.isArray(selectedElement)) {
    return selectedElement
      .map((item) => _.get(config, getConfigPathFromDataPath(item, config)))
      .filter((item) => item);
  } else {
    // If selected element starts with curly braces, it's a fieldset: {passwords}.fieldid
    if (
      typeof store.selectedElement === "string" &&
      store.selectedElement.startsWith("{")
    ) {
      const pathSplit = store.selectedElement.substring(1).split("}");
      const fieldSetConfig = _.find(store.fieldsets, { id: pathSplit[0] });
      if (fieldSetConfig) {
        const pathInFieldset = pathSplit[1].substring(1);
        let tempConfig = _.get(
          fieldSetConfig.config,
          getConfigPathFromDataPath(pathInFieldset, fieldSetConfig.config)
        );
        if (Array.isArray(tempConfig))
          tempConfig = tempConfig.filter((item) => item);
        return tempConfig;
      }
    } else {
      let tempConfig = _.get(
        config,
        getConfigPathFromDataPath(selectedElement, config)
      );
      if (Array.isArray(tempConfig))
        tempConfig = tempConfig.filter((item) => item);
      return tempConfig;
    }
  }
  return null;
};

const FieldConfigEditor = ({ handleEditFieldConfig }) => {
  const store = useStagesStore();
  const path = store.selectedElement;
  const isFieldsetItem =
    typeof store.selectedElement === "string" &&
    store.selectedElement.startsWith("{");
  const config = getSelectedConfig(
    store.currentConfig,
    store.selectedElement,
    store
  );
  const [data, setData] = useState(
    Array.isArray(config) ? getSameData(config) : config
  );
  const fieldsetConfig = _.find(store.fieldsets, {
    id: path.slice(path.indexOf("{") + 1, path.indexOf("}")),
  });

  if (
    !config ||
    (typeof config !== "object" && !Array.isArray(config)) ||
    !path
  ) {
    if (isFieldsetItem)
      return (
        <Message
          severity="info"
          text="You've selected a field from a Fieldset. If you edit it, you edit all instances of the fieldset."
        />
      );
    return (
      <Message
        severity="info"
        text="Select field, group or collection to edit its configuration."
      />
    );
  }

  const extendedFieldProps = { ...fieldProps }; // Contains additionallly all fieldsets
  store.fieldsets.forEach((fieldset) => {
    if (!extendedFieldProps[fieldset.id]) {
      extendedFieldProps[fieldset.id] = [
        {
          id: "warningsDivider",
          type: "divider",
          text: "Info",
          isInterfaceState: true,
        },
        {
          id: "message",
          type: "message",
          severity: "warn",
          text: "This is a Fieldset. If you edit it's fields, you change all other instances where this fieldset is in use.",
          isInterfaceState: true,
        },
        {
          id: "specificsDivider",
          type: "divider",
          text: "Field Specifics",
        },
        {
          id: "id",
          type: "blurtext",
          label: "ID",
          isRequired: true,
          filter: (value) => value.replace(/[^a-zA-Z0-9-]/g, ""),
        },
        {
          id: "isRendered",
          type: "textarea",
          autoResize: true,
          label: "Is Rendered?",
          placeholder: "!!data.myCheckbox",
        },
      ];
    }
  });

  const actualConfig = Array.isArray(config)
    ? getSameProperties(config)
    : parseConfig(extendedFieldProps[config.type]);

  if (isFieldsetItem && !fieldsetConfig.path) {
    return (
      <>
        <>
          <Message
            severity="warn"
            text="This is a global fieldset, you can't edit it. If you want to edit its fields, first diconnect the fieldset."
          />
          <InspectorSpacer />
        </>
        <div className="flex">
          <div className="flex-grow-1" style={{ paddingTop: "6px" }}>
            {Array.isArray(path) ? (
              path.map((p, i) => <FormattedPath key={i} path={p} />)
            ) : (
              <FormattedPath path={path} />
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {isFieldsetItem && (
        <>
          <Message
            severity="warn"
            text="You've selected a field from a Fieldset. If you edit it, you edit all instances of the fieldset."
          />
          <InspectorSpacer />
        </>
      )}
      <div className="flex">
        <div className="flex-grow-1" style={{ paddingTop: "6px" }}>
          <Waypoints size={14} />{" "}
          {Array.isArray(path) ? (
            path.map((p, i) => <FormattedPath key={i} path={p} />)
          ) : (
            <FormattedPath path={path} />
          )}
        </div>
      </div>
      {Array.isArray(actualConfig) ? (
        <Form
          key={`configForm-${
            typeof config === "object" ? config.type : "multiselect"
          }`}
          id={`configForm-${
            typeof config === "object" ? config.type : "multiselect"
          }`}
          data={data}
          fields={primeFields}
          config={{
            fields: () => {
              return actualConfig;
            },
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
          onChange={(payload) => {
            if (!Array.isArray(config)) {
              if (payload.type !== data.type)
                payload = removeNonMatchingProperties(payload, payload.type);
              setData(payload);
              handleEditFieldConfig(path, payload, isFieldsetItem);
            } else {
              // Multiple fields are selected, so change all fields if there is an actualy data change
              // Find out what has changed and than apply that to all paths
              const diff = _.differenceWith(
                _.toPairs(payload),
                _.toPairs(data),
                _.isEqual
              );
              setData(payload);
              handleEditFieldConfig(path, diff, isFieldsetItem);
            }
          }}
        />
      ) : null}
    </>
  );
};

export default FieldConfigEditor;
