import React from 'react';

import CollectionContainer from '../components/CollectionContainer';
import AbsoluteRight from '../components/AbsoluteRight';
import InnerAbsoluteRight from '../components/InnerAbsoluteRight';
import RemoveCollectionEntry from '../components/RemoveCollectionEntry';
import AddCollectionEntry from '../components/AddCollectionEntry';
import Alert from 'react-bootstrap/Alert';

import i18n from '../../../energyschweiz/ech-i18n';

const FormRenderer = ({ fields, onCollectionAction, errors, locale }) => {
  return (
    <div>
      <div style={{ position: 'relative' }}>
        {fields.uploads
          ? fields.uploads.map((subFields, index) => (
              <CollectionContainer key={`upload-${index}`}>
                {subFields.upload}
                {index > 0 ? (
                  <InnerAbsoluteRight>
                    <RemoveCollectionEntry
                      onClick={() =>
                        onCollectionAction('uploads', 'remove', index)
                      }
                    />
                  </InnerAbsoluteRight>
                ) : null}
              </CollectionContainer>
            ))
          : null}
        <AbsoluteRight>
          <AddCollectionEntry
            onClick={() => onCollectionAction('uploads', 'add')}
          />
        </AbsoluteRight>
        {errors && errors.uploads ? (
          <Alert variant="danger">
            {i18n.errors.collectionMinEntries[locale]}
          </Alert>
        ) : null}
      </div>
    </div>
  );
};

export default FormRenderer;
