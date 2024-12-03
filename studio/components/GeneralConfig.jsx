import { useEffect } from "react";
import { Form } from "react-stages";
import primeFields from "./primeFields";
import { FieldRenderer } from "./FieldRenderer";
import useStagesStore from "./store";
import isoLangs from "./isoLangs";
import { truncateString } from "./helpers";

const GeneralConfig = () => {
  const store = useStagesStore();

  useEffect(() => {
    useStagesStore.persist.rehydrate();
  }, []);

  return (
    <>
      <Form
        key={`generalConfig`}
        id={`generalConfig`}
        data={store.generalConfig}
        fields={primeFields}
        config={{
          fields: () => {
            return [
              {
                id: "title",
                type: "text",
                label: "Title",
                isRequired: true,
              },
              {
                id: "slug",
                type: "text",
                label: "Slug",
                isRequired: true,
                isDisabled: true,
              },
              {
                id: "status",
                type: "buttons",
                label: "Status",
                defaultValue: "draft",
                options: [
                  {
                    value: "draft",
                    text: "Draft",
                  },
                  {
                    value: "published",
                    text: "Published",
                  },
                  {
                    value: "archived",
                    text: "Archived",
                  },
                ],
              },
              {
                id: "divider1",
                type: "divider",
              },
              {
                id: "locales",
                type: "multiselect",
                label: "Locales",
                showFilter: true,
                showSelectAll: false,
                display: "chip",
                options: Object.keys(isoLangs).map((lang) => ({
                  value: lang.toUpperCase(),
                  text: `${lang.toUpperCase()}: ${truncateString(
                    isoLangs[lang].name,
                    32
                  )}`,
                })),
              },
              {
                id: "components",
                type: "select",
                label: "Field Components",
                defaultValue: "plain",
                options: [
                  {
                    value: "plain",
                    text: "Stages Plain Fields",
                  },
                  {
                    value: "prime",
                    text: "Prime React",
                  },
                  {
                    value: "radix",
                    text: "Radix UI",
                  },
                ],
              },
              {
                id: "date",
                type: "group",
                label: "Date",
                fields: [
                  {
                    id: "from",
                    type: "calendar",
                    label: "Enabled From",
                    showTime: true,
                    hideOnDateTimeSelect: true,
                  },
                  {
                    id: "to",
                    type: "calendar",
                    label: "Enabled To",
                    showTime: true,
                    hideOnDateTimeSelect: true,
                  },
                ],
              },
            ];
          },
        }}
        render={({ actionProps, fieldProps }) => {
          return (
            <>
              <form>
                <div style={{ position: "relative", margin: "-8px" }}>
                  <FieldRenderer
                    parent="_"
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
          store.updateGeneralConfig(payload);
        }}
      />
    </>
  );
};

export default GeneralConfig;
