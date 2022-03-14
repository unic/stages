import React from 'react';

const AbsoluteRight = ({ children }) => (
  <div
    style={{
      position: 'absolute',
      content: '',
      top: '0',
      right: '-40px',
      width: '24px',
    }}
  >
    {children}
  </div>
);

export default AbsoluteRight;
