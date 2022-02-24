import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";

import AbsoluteRight from "../components/AbsoluteRight";
import InnerAbsoluteRight from "../components/InnerAbsoluteRight";
import RemoveCollectionEntry from "../components/RemoveCollectionEntry";
import AddCollectionEntry from "../components/AddCollectionEntry";

const FormRenderer = ({ fields, onCollectionAction, data, errors }) => {
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
                {errors && errors.uploads ? <div style={{ color: "#dc3545" }}>Bitte fügen Sie mindestens einen Programmeintrag hinzu!</div> : null}
            </div>
        </div>
    );
};

export default FormRenderer;