import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

import AbsoluteRight from "../components/AbsoluteRight";
import InnerAbsoluteRight from "../components/InnerAbsoluteRight";
import RemoveCollectionEntry from "../components/RemoveCollectionEntry";
import AddCollectionEntry from "../components/AddCollectionEntry";

const FormRenderer = ({ fields, onCollectionAction, data, errors }) => {
    return (
        <div>
            <div style={{ position: "relative" }}>
                <label className="form-label" htmlFor="internalExpenses">Einsatz von Mitarbeitenden</label>
                {fields.internalExpenses ? fields.internalExpenses.map((subFields, index) => (
                    <div key={`internalExpense-${index}`} style={{ position: "relative" }}>
                        <Row>
                            <Col>{subFields.date}</Col>
                            <Col>{subFields.milestone}</Col>
                            <Col>{subFields.workPackage}</Col>
                            <Col>{subFields.function}</Col>
                        </Row>
                        <Row>
                            <Col>{subFields.hourlyRate}</Col>
                            <Col>{subFields.hourEffort}</Col>
                            <Col>{" "}</Col>
                            <Col>{subFields.costs}</Col>
                        </Row>
                        {index > 0 ? <InnerAbsoluteRight><RemoveCollectionEntry onClick={() => onCollectionAction("internalExpenses", "remove", index)} /></InnerAbsoluteRight> : null}
                    </div>)
                ) : null}
                <AbsoluteRight>
                    <AddCollectionEntry onClick={() => onCollectionAction("internalExpenses", "add")} />
                </AbsoluteRight>
                {errors && errors.internalExpenses ? <div style={{ color: "#dc3545" }}>Bitte fügen Sie mindestens einen Programmeintrag hinzu!</div> : null}
            </div>
            <div style={{ position: "relative" }}>
                <label className="form-label" htmlFor="otherExpenses">Einsatz von Mitarbeitenden</label>
                {fields.otherExpenses ? fields.otherExpenses.map((subFields, index) => (
                    <div key={`otherCost-${index}`} style={{ position: "relative" }}>
                        <Row>
                            <Col>{subFields.date}</Col>
                            <Col>{subFields.milestone}</Col>
                            <Col>{subFields.workPackage}</Col>
                            <Col>{subFields.expenseType}</Col>
                        </Row>
                        <Row>
                            <Col lg="6">{subFields.derivation}</Col>
                            <Col lg="3">{" "}</Col>
                            <Col lg="3">{subFields.expenses}</Col>
                        </Row>
                        {index > 0 ? <InnerAbsoluteRight><RemoveCollectionEntry onClick={() => onCollectionAction("otherExpenses", "remove", index)} /></InnerAbsoluteRight> : null}
                    </div>)
                ) : null}
                <AbsoluteRight>
                    <AddCollectionEntry onClick={() => onCollectionAction("otherExpenses", "add")} />
                </AbsoluteRight>
                {errors && errors.otherExpenses ? <div style={{ color: "#dc3545" }}>Bitte fügen Sie mindestens einen Programmeintrag hinzu!</div> : null}
            </div>
            <br />
            {fields.total}
        </div>
    );
};

export default FormRenderer;