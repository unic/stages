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
    <div style={{ marginBottom: '32px' }}>
      <Row>{fields.requestingOrganisation}</Row>
      <Row>{fields.responsiblePerson}</Row>
      <div style={{ position: 'relative' }}>
        <label className="form-label" htmlFor="employee">
          {i18n.employees[locale]}
        </label>
        {fields.employees
          ? fields.employees.map((subFields, index) => (
              <CollectionContainer key={`employee-${index}`}>
                <Row>
                  <Col>{subFields.fullName}</Col>
                  <Col>{subFields.organisation}</Col>
                  <Col>{subFields.function}</Col>
                  <Col style={{ marginTop: '6px' }}>
                    {subFields.signedContract}
                  </Col>
                  {index > 0 ? (
                    <InnerAbsoluteRight>
                      <RemoveCollectionEntry
                        onClick={() =>
                          onCollectionAction('employees', 'remove', index)
                        }
                      />
                    </InnerAbsoluteRight>
                  ) : null}
                </Row>
              </CollectionContainer>
            ))
          : null}
        <AbsoluteRight>
          <AddCollectionEntry
            onClick={() => onCollectionAction('employees', 'add')}
          />
        </AbsoluteRight>
        {errors['employees'] ? (
          <Alert variant="danger">
            {i18n.errors.collectionMinEntries[locale]}
          </Alert>
        ) : null}
      </div>
      <br />
      <div style={{ position: 'relative' }}>
        <label className="form-label" htmlFor="partner">
          {i18n.projectPartners[locale]}
        </label>
        {fields.projectPartners
          ? fields.projectPartners.map((subFields, index) => (
              <CollectionContainer key={`projectPartner-${index}`}>
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
                {index > 0 ? (
                  <InnerAbsoluteRight>
                    <RemoveCollectionEntry
                      onClick={() =>
                        onCollectionAction('projectPartners', 'remove', index)
                      }
                    />
                  </InnerAbsoluteRight>
                ) : null}
              </CollectionContainer>
            ))
          : null}
        <AbsoluteRight>
          <AddCollectionEntry
            onClick={() => onCollectionAction('projectPartners', 'add')}
          />
        </AbsoluteRight>
        {errors['projectPartners'] ? (
          <Alert variant="danger">
            {i18n.errors.collectionMinEntries[locale]}
          </Alert>
        ) : null}
      </div>
      <Row>{fields.projectManager}</Row>
    </div>
  );
};

export default FormRenderer;
