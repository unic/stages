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
            <label className="form-label">Projekteinnnahmen</label>
            <Row>
                <Col>{fields.projectIncome[0].firstYear}</Col>
                <Col>{fields.projectIncome[0].secondYear}</Col>
                <Col>{fields.projectIncome[0].thirdYear}</Col>
                <Col>{fields.projectIncome[0].fourthYear}</Col>
            </Row>
            <Row>
                <Col>{" "}</Col>
                <Col>{" "}</Col>
                <Col>{" "}</Col>
                <Col>{fields.projectIncome[0].total}</Col>
            </Row>
            <br />
            <label className="form-label">Beantragte Subvention EnergieSchweiz</label>
            <Row>
                <Col>{fields.echSubvention[0].firstYear}</Col>
                <Col>{fields.echSubvention[0].secondYear}</Col>
                <Col>{fields.echSubvention[0].thirdYear}</Col>
                <Col>{fields.echSubvention[0].fourthYear}</Col>
            </Row>
            <Row>
                <Col lg="3">{" "}</Col>
                <Col lg="6">{fields.echSubvention[0].percentageOfTotalCosts}</Col>
                <Col lg="3">{fields.echSubvention[0].total}</Col>
            </Row>
            <br />
            <label className="form-label">Weitere Bundesmittel</label>
            <Row>
                <Col>{fields.governmentFunding[0].firstYear}</Col>
                <Col>{fields.governmentFunding[0].secondYear}</Col>
                <Col>{fields.governmentFunding[0].thirdYear}</Col>
                <Col>{fields.governmentFunding[0].fourthYear}</Col>
            </Row>
            <Row>
                <Col lg="6">{fields.governmentFunding[0].origin}</Col>
                <Col lg="3">{" "}</Col>
                <Col lg="3">{fields.governmentFunding[0].total}</Col>
            </Row>
            <br />
            <label className="form-label">Weitere Förderbeiträge (Kantone, Gemeinden, Hochschulen, Unternehmen)</label>
            <div style={{ position: "relative" }}>
                <label className="form-label" htmlFor="furtherFundings">Einsatz von Mitarbeitenden</label>
                <small className="text-muted form-text">Lorem ipsum dolor sit amet</small>
                {fields.furtherFundings ? fields.furtherFundings.map((subFields, index) => (
                    <div key={`furtherFunding-${index}`} style={{ position: "relative" }}>
                        <Row>
                            <Col>{subFields.firstYear}</Col>
                            <Col>{subFields.secondYear}</Col>
                            <Col>{subFields.thirdYear}</Col>
                            <Col>{subFields.fourthYear}</Col>
                        </Row>
                        <Row>
                            <Col lg="6">{subFields.origin}</Col>
                            <Col lg="3">{" "}</Col>
                            <Col lg="3">{subFields.total}</Col>
                        </Row>
                        {index > 0 ? <InnerAbsoluteRight><RemoveCollectionEntry onClick={() => onCollectionAction("furtherFundings", "remove", index)} /></InnerAbsoluteRight> : null}
                    </div>)
                ) : null}
                <AbsoluteRight>
                    <AddCollectionEntry onClick={() => onCollectionAction("furtherFundings", "add")} />
                </AbsoluteRight>
                {errors && errors.furtherFundings ? <div style={{ color: "#dc3545" }}>Bitte fügen Sie mindestens einen Programmeintrag hinzu!</div> : null}
            </div>
            <br />
            <label className="form-label">Finanzielle Eigenleitstungen</label>
            <Row>
                <Col>{fields.ownResources[0].firstYear}</Col>
                <Col>{fields.ownResources[0].secondYear}</Col>
                <Col>{fields.ownResources[0].thirdYear}</Col>
                <Col>{fields.ownResources[0].fourthYear}</Col>
            </Row>
            <Row>
                <Col>{" "}</Col>
                <Col>{" "}</Col>
                <Col>{" "}</Col>
                <Col>{fields.ownResources[0].total}</Col>
            </Row>
            <br />
            <label className="form-label">Unentgeltliche Eigenleistungen</label>
            <Row>
                <Col>{fields.unpaidOwnContributions[0].firstYear}</Col>
                <Col>{fields.unpaidOwnContributions[0].secondYear}</Col>
                <Col>{fields.unpaidOwnContributions[0].thirdYear}</Col>
                <Col>{fields.unpaidOwnContributions[0].fourthYear}</Col>
            </Row>
            <Row>
                <Col>{" "}</Col>
                <Col>{" "}</Col>
                <Col>{" "}</Col>
                <Col>{fields.unpaidOwnContributions[0].total}</Col>
            </Row>
            <br />
            <label className="form-label">Unentgeltliche Leistungen Dritter</label>
            <Row>
                <Col>{fields.thirdPartyContributions[0].firstYear}</Col>
                <Col>{fields.thirdPartyContributions[0].secondYear}</Col>
                <Col>{fields.thirdPartyContributions[0].thirdYear}</Col>
                <Col>{fields.thirdPartyContributions[0].fourthYear}</Col>
            </Row>
            <Row>
                <Col>{" "}</Col>
                <Col>{" "}</Col>
                <Col>{" "}</Col>
                <Col>{fields.thirdPartyContributions[0].total}</Col>
            </Row>
            <br />
            {fields.restMoney}
            <br />
            <div style={{ position: "relative" }}>
                <label className="form-label" htmlFor="paymentPlan">Einsatz von Mitarbeitenden</label>
                {fields.paymentPlan ? fields.paymentPlan.map((subFields, index) => (
                    <div key={`paymentPlan-${index}`} style={{ position: "relative" }}>
                        <Row>
                            <Col>{subFields.date}</Col>
                            <Col>{subFields.description}</Col>
                            <Col>{subFields.amount}</Col>
                            <Col>{" "}</Col>
                        </Row>
                        {index > 0 ? <InnerAbsoluteRight><RemoveCollectionEntry onClick={() => onCollectionAction("paymentPlan", "remove", index)} /></InnerAbsoluteRight> : null}
                    </div>)
                ) : null}
                <AbsoluteRight>
                    <AddCollectionEntry onClick={() => onCollectionAction("paymentPlan", "add")} />
                </AbsoluteRight>
                {errors && errors.paymentPlan ? <div style={{ color: "#dc3545" }}>Bitte fügen Sie mindestens einen Programmeintrag hinzu!</div> : null}
            </div>
            <br />
            {fields.justification}
        </div>
    );
};

export default FormRenderer;