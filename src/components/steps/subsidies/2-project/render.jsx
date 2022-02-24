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
            <Row>{fields.topic}</Row>
            <Row>{fields.projectTitle}</Row>
            <Row>
                <label className="form-label">Projektdauer</label>
                <small className="text-muted form-text">Lorem ipsum dolor sit amet</small>
            </Row>
            <Row>
                <Col>{fields.fromDate}</Col>
                <Col>{fields.toDate}</Col>
            </Row>
            <Row>{fields.initialSituation}</Row>
            <Row>{fields.descriptionAndProcedure}</Row>
            <Row>{fields.requirements}</Row>
            <div style={{ position: "relative" }}>
                <label className="form-label" htmlFor="goals">Projektziele und Messung</label>
                <small className="text-muted form-text">Lorem ipsum dolor sit amet</small>
                {fields.goals ? fields.goals.map((subFields, index) => (
                    <div key={`goal-${index}`} style={{ position: "relative" }}>
                        <Row>
                            <Col>{subFields.goal}</Col>
                            <Col>{subFields.successIndicator}</Col>
                        </Row>
                        {index > 0 ? <InnerAbsoluteRight><RemoveCollectionEntry onClick={() => onCollectionAction("goals", "remove", index)} /></InnerAbsoluteRight> : null}
                    </div>)
                ) : null}
                <AbsoluteRight>
                    <AddCollectionEntry onClick={() => onCollectionAction("goals", "add")} />
                </AbsoluteRight>
                {errors && errors.goals ? <div style={{ color: "#dc3545" }}>Bitte fügen Sie mindestens einen Programmeintrag hinzu!</div> : null}
            </div>
            <div style={{ position: "relative" }}>
                <label className="form-label" htmlFor="impactsAndMeasurements">Projektwirkung und Messung</label>
                <small className="text-muted form-text">Lorem ipsum dolor sit amet</small>
                {fields.impactsAndMeasurements ? fields.impactsAndMeasurements.map((subFields, index) => (
                    <div key={`impactsAndMeasurement-${index}`} style={{ position: "relative" }}>
                        <Row>
                            <Col>{subFields.impact}</Col>
                            <Col>{subFields.successIndicator}</Col>
                        </Row>
                        {index > 0 ? <InnerAbsoluteRight><RemoveCollectionEntry onClick={() => onCollectionAction("impactsAndMeasurements", "remove", index)} /></InnerAbsoluteRight> : null}
                    </div>)
                ) : null}
                <AbsoluteRight>
                    <AddCollectionEntry onClick={() => onCollectionAction("impactsAndMeasurements", "add")} />
                </AbsoluteRight>
                {errors && errors.impactsAndMeasurements ? <div style={{ color: "#dc3545" }}>Bitte fügen Sie mindestens einen Programmeintrag hinzu!</div> : null}
            </div>
            <div style={{ position: "relative" }}>
                <label className="form-label" htmlFor="targetGroups">Zielgruppen</label>
                <small className="text-muted form-text">Lorem ipsum dolor sit amet</small>
                {fields.targetGroups ? fields.targetGroups.map((subFields, index) => (
                    <div key={`targetGroup-${index}`} style={{ position: "relative" }}>
                        <Row>
                            <Col>{subFields.group}</Col>
                            <Col>{subFields.groupIdentification}</Col>
                        </Row>
                        {index > 0 ? <InnerAbsoluteRight><RemoveCollectionEntry onClick={() => onCollectionAction("targetGroups", "remove", index)} /></InnerAbsoluteRight> : null}
                    </div>)
                ) : null}
                <AbsoluteRight>
                    <AddCollectionEntry onClick={() => onCollectionAction("targetGroups", "add")} />
                </AbsoluteRight>
                {errors && errors.targetGroups ? <div style={{ color: "#dc3545" }}>Bitte fügen Sie mindestens einen Programmeintrag hinzu!</div> : null}
            </div>
            <br />
            {fields.regionCoverage}
            <br />
            {fields.services}
            <br />
        </div>
    );
};

export default FormRenderer;