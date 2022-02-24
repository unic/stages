import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

import AbsoluteRight from "../components/AbsoluteRight";
import InnerAbsoluteRight from "../components/InnerAbsoluteRight";
import RemoveCollectionEntry from "../components/RemoveCollectionEntry";
import AddCollectionEntry from "../components/AddCollectionEntry";

const FormRenderer = ({ fields, onCollectionAction, data, errors }) => {
    return (
        <div style={{ marginBottom: "32px" }}>
            {fields.requestingOrganisation}
            <br />
            {fields.responsiblePerson}
            <br />
            <div style={{ position: "relative" }}>
                <label className="form-label" htmlFor="employee">Einsatz von Mitarbeitenden</label>
                <small className="text-muted form-text">Lorem ipsum dolor sit amet</small>
                {fields.employees ? fields.employees.map((subFields, index) => (
                    <div key={`employee-${index}`} style={{ position: "relative" }}>
                        <Row>
                            <Col>{subFields.fullName}</Col>
                            <Col>{subFields.organisation}</Col>
                            <Col>{subFields.function}</Col>
                            <Col style={{marginTop: "6px"}}>{subFields.signedContract}</Col>
                            {index > 0 ? <InnerAbsoluteRight><RemoveCollectionEntry onClick={() => onCollectionAction("employees", "remove", index)} /></InnerAbsoluteRight> : null}
                        </Row>
                    </div>)
                ) : null}
                <AbsoluteRight>
                    <AddCollectionEntry onClick={() => onCollectionAction("employees", "add")} />
                </AbsoluteRight>
                {errors["employees"] ? <div style={{ color: "#dc3545" }}>Bitte erfassen Sie mindestens einen Eintrag.</div> : null}
            </div>
            <br />
            <div style={{ position: "relative" }}>
                <label className="form-label" htmlFor="partner">Weitere Projektpartner</label>
                <small className="text-muted form-text">Lorem ipsum dolor sit amet</small>
                {fields.projectPartners ? fields.projectPartners.map((subFields, index) => (
                    <div key={`projectPartner-${index}`} style={{ position: "relative" }}>
                        <Row>
                            <Col>{subFields.organisationName}</Col>
                        </Row>
                        <Row>
                            <Col>{subFields.zipCode}</Col>
                            <Col>{subFields.location}</Col>
                        </Row>
                        <Row>
                            <Col>{subFields.street}</Col>
                            <Col>{subFields.houseNumber}</Col>
                        </Row>
                        <Row>
                            <Col>{subFields.lastName}</Col>
                            <Col>{subFields.firstName}</Col>
                        </Row>
                        {index > 0 ? <AbsoluteRight><RemoveCollectionEntry onClick={() => onCollectionAction("projectPartners", "remove", index)} /></AbsoluteRight> : null}
                    </div>
                )
                ) : null}
                <AbsoluteRight>
                    <AddCollectionEntry onClick={() => onCollectionAction("projectPartners", "add")} />
                </AbsoluteRight>
                {errors["projectPartners"] ? <div style={{ color: "#dc3545" }}>Bitte erfassen Sie mindestens einen Eintrag.</div> : null}
            </div>
            <br />
            {fields.projectManager}
        </div>
    );
};

export default FormRenderer;