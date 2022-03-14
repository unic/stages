import React from 'react';

const InnerAbsoluteRight = ({ children }) => (
  <div
    style={{
      position: 'absolute',
      content: '',
      top: '3px',
      right: '-36px',
      width: '24px',
    }}
  >
    {children}
  </div>
);

export default InnerAbsoluteRight;
