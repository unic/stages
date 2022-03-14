import React from 'react';
import Button from 'react-bootstrap/Button';

const RemoveCollectionEntry = ({ onClick }) => (
  <Button
    variant="plain"
    type="button"
    size="sm"
    onClick={onClick}
    style={{
      color: '#dc3545',
      width: '18px',
      height: '18px',
      lineHeight: 0,
      fontSize: '20px',
      fontWeight: 300,
      padding: 0,
    }}
  >
    x
  </Button>
);

export default RemoveCollectionEntry;
