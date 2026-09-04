import useStagesStore from "./store";
import isoLangs from "./isoLangs";
import { truncateString } from "./helpers";
import { StudioV1Form } from "./v1/StudioV1Preview";
import { useShallow } from "zustand/react/shallow";

const generalConfigFields = [
  {
    id: "title",
    type: "text",
    label: "Title",
    isRequired: true,
    isInInspector: true,
  },
  {
    id: "slug",
    type: "text",
    label: "Slug",
    isRequired: true,
    isDisabled: true,
    isInInspector: true,
  },
  {
    id: "status",
    type: "buttons",
    label: "Status",
    defaultValue: "draft",
    isInInspector: true,
    options: [
      { value: "draft", text: "Draft" },
      { value: "published", text: "Published" },
      { value: "archived", text: "Archived" },
    ],
  },
  { id: "divider1", type: "divider", isInInspector: true },
  {
    id: "locales",
    type: "multiselect",
    label: "Locales",
    showFilter: true,
    showSelectAll: false,
    display: "chip",
    isInInspector: true,
    options: Object.keys(isoLangs).map((lang) => ({
      value: lang.toUpperCase(),
      text: `${lang.toUpperCase()}: ${truncateString(isoLangs[lang].name, 32)}`,
    })),
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
        isInInspector: true,
      },
      {
        id: "to",
        type: "calendar",
        label: "Enabled To",
        showTime: true,
        hideOnDateTimeSelect: true,
        isInInspector: true,
      },
    ],
  },
];

const GeneralConfig = () => {
  const store = useStagesStore(useShallow((state) => ({
    generalConfig: state.generalConfig,
    updateGeneralConfig: state.updateGeneralConfig,
  })));

  return (
    <StudioV1Form
      config={generalConfigFields}
      value={store.generalConfig}
      onChange={store.updateGeneralConfig}
      compact
      showCompatibilityDiagnostics={false}
    />
  );
};

export default GeneralConfig;
