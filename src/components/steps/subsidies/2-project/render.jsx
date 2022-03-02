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
        <div>
            <Row>{fields.topic}</Row>
            <Row>{fields.projectTitle}</Row>
            <Row>
                <label className="form-label">{i18n.projectDuration[locale]}</label>
            </Row>
            <Row>
                <Col>{fields.fromDate}</Col>
                <Col>{fields.toDate}</Col>
            </Row>
            <Row>{fields.initialSituation}</Row>
            <Row>{fields.scriptionAndProcedure[locale]}</Row>
            <Row>{fields.requirements}</Row>
            <div style={{ position: "relative" }}>
                <label className="form-label" htmlFor="goals">{i18n.goals[locale]}</label>
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
                    <CollectionTooltip text="Test" />
                </AbsoluteRight>
                {errors && errors.goals ? <div style={{ color: "#dc3545" }}>{i18n.errors.collectionMinEntries}</div> : null}
            </div>
            <div style={{ position: "relative" }}>
                <label className="form-label" htmlFor="impactsAndMeasurements">{i18n.impactsAndMeasurements[locale]}</label>
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
                    <CollectionTooltip text="Test" />
                </AbsoluteRight>
                {errors && errors.impactsAndMeasurements ? <div style={{ color: "#dc3545" }}>{i18n.errors.collectionMinEntries[locale]}</div> : null}
            </div>
            <div style={{ position: "relative" }}>
                <label className="form-label" htmlFor="targetGroups">{i18n.targetGroups[locale]}</label>
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
                {errors && errors.targetGroups ? <div style={{ color: "#dc3545" }}>{i18n.errors.collectionMinEntries[locale]}</div> : null}
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