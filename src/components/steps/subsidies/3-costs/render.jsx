import React from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Alert from 'react-bootstrap/Alert';

import CollectionContainer from '../components/CollectionContainer';
import AbsoluteRight from '../components/AbsoluteRight';
import InnerAbsoluteRight from '../components/InnerAbsoluteRight';
import RemoveCollectionEntry from '../components/RemoveCollectionEntry';
import AddCollectionEntry from '../components/AddCollectionEntry';

import i18n from '../../../energyschweiz/ech-i18n';

const FormRenderer = ({ fields, onCollectionAction, errors, locale }) => {
  return (
    <div>
      <div style={{ position: 'relative' }}>
        <label className="form-label" htmlFor="internalExpenses">
          {i18n.internalExpenses[locale]}
        </label>
        {fields.internalExpenses
          ? fields.internalExpenses.map((subFields, index) => (
              <CollectionContainer key={`internalExpense-${index}`}>
                <Row>
                  <Col>{subFields.date}</Col>
                  <Col>{subFields.milestone}</Col>
                  <Col>{subFields.workPackage}</Col>
                  <Col>{subFields.function}</Col>
                </Row>
                <Row>
                  <Col>{subFields.hourlyRate}</Col>
                  <Col>{subFields.hourEffort}</Col>
                  <Col> </Col>
                  <Col>{subFields.costs}</Col>
                </Row>
                {index > 0 ? (
                  <InnerAbsoluteRight>
                    <RemoveCollectionEntry
                      onClick={() =>
                        onCollectionAction('internalExpenses', 'remove', index)
                      }
                    />
                  </InnerAbsoluteRight>
                ) : null}
              </CollectionContainer>
            ))
          : null}
        <AbsoluteRight>
          <AddCollectionEntry
            onClick={() => onCollectionAction('internalExpenses', 'add')}
          />
        </AbsoluteRight>
        {errors && errors.internalExpenses ? (
          <Alert variant="danger">
            {i18n.errors.collectionMinEntries[locale]}
          </Alert>
        ) : null}
      </div>
      <div style={{ position: 'relative' }}>
        <label className="form-label" htmlFor="otherExpenses">
          {i18n.otherExpenses[locale]}
        </label>
        {fields.otherExpenses
          ? fields.otherExpenses.map((subFields, index) => (
              <CollectionContainer key={`otherCost-${index}`}>
                <Row>
                  <Col>{subFields.date}</Col>
                  <Col>{subFields.milestone}</Col>
                  <Col>{subFields.workPackage}</Col>
                  <Col>{subFields.expenseType}</Col>
                </Row>
                <Row>
                  <Col lg="6">{subFields.derivation}</Col>
                  <Col lg="3"> </Col>
                  <Col lg="3">{subFields.expenses}</Col>
                </Row>
                {index > 0 ? (
                  <InnerAbsoluteRight>
                    <RemoveCollectionEntry
                      onClick={() =>
                        onCollectionAction('otherExpenses', 'remove', index)
                      }
                    />
                  </InnerAbsoluteRight>
                ) : null}
              </CollectionContainer>
            ))
          : null}
        <AbsoluteRight>
          <AddCollectionEntry
            onClick={() => onCollectionAction('otherExpenses', 'add')}
          />
        </AbsoluteRight>
        {errors && errors.otherExpenses ? (
          <Alert variant="danger">
            {i18n.errors.collectionMinEntries[locale]}
          </Alert>
        ) : null}
      </div>
      <br />
      {fields.total}
    </div>
  );
};

export default FormRenderer;
