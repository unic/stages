import AbsoluteRight from "../components/AbsoluteRight";
import InnerAbsoluteRight from "../components/InnerAbsoluteRight";
import RemoveCollectionEntry from "../components/RemoveCollectionEntry";
import AddCollectionEntry from "../components/AddCollectionEntry";

import i18n from "../../../energyschweiz/ech-i18n";

const FormRenderer = ({ fields, onCollectionAction, data, errors, locale }) => {
    return (
        <div>
            <div style={{ position: "relative" }}>
                {fields.uploads ? fields.uploads.map((subFields, index) => (
                    <div key={`upload-${index}`} style={{ position: "relative" }}>
                        {subFields.upload}
                        {index > 0 ? <InnerAbsoluteRight><RemoveCollectionEntry onClick={() => onCollectionAction("uploads", "remove", index)} /></InnerAbsoluteRight> : null}
                    </div>)
                ) : null}
                <AbsoluteRight>
                    <AddCollectionEntry onClick={() => onCollectionAction("uploads", "add")} />
                </AbsoluteRight>
                {errors && errors.uploads ? <div style={{ color: "#dc3545" }}>{i18n.errors.collectionMinEntries[locale]}</div> : null}
            </div>
        </div>
    );
};

export default FormRenderer;