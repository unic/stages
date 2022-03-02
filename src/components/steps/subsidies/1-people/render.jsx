import React from "react";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

import AbsoluteRight from "../components/AbsoluteRight";
import InnerAbsoluteRight from "../components/InnerAbsoluteRight";
import RemoveCollectionEntry from "../components/RemoveCollectionEntry";
import AddCollectionEntry from "../components/AddCollectionEntry";
import CollectionTooltip from "../components/CollectionTooltip";

import i18n from "../../../energyschweiz/ech-i18n";

const FormRenderer = ({ fields, onCollectionAction, data, errors, locale }) => {
    return (
        <div style={{ marginBottom: "32px" }}>
            {fields.requestingOrganisation}
            <br />
            {fields.responsiblePerson}
            <br />
            <div style={{ position: "relative" }}>
                <label className="form-label" htmlFor="employee">{i18n.employees[locale]}</label>
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
                {errors["employees"] ? <div style={{ color: "#dc3545" }}>{i18n.errors.collectionMinEntries[locale]}</div> : null}
            </div>
            <br />
            <div style={{ position: "relative" }}>
                <label className="form-label" htmlFor="partner">{i18n.projectPartners[locale]}</label>
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
                {errors["projectPartners"] ? <div style={{ color: "#dc3545" }}>{i18n.errors.collectionMinEntries[locale]}</div> : null}
            </div>
            <br />
            {fields.projectManager}
        </div>
    );
};

export default FormRenderer;