import React from 'react';
import Button from 'react-bootstrap/Button';

const AddCollectionEntry = ({ onClick }) => (
  <Button
    type="button"
    size="sm"
    variant="success"
    onClick={onClick}
    style={{
      width: '18px',
      height: '18px',
      lineHeight: '24px',
      fontSize: '16px',
      fontWeight: 700,
      padding: 0,
      borderRadius: 0,
    }}
  >
    <sup>+</sup>
  </Button>
);

export default AddCollectionEntry;
