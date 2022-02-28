import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import Subsidies from './Subsidies';

if (process.env.REACT_APP_BUILD_TARGET === 'subsidies') {
  ReactDOM.render(
    <React.StrictMode>
      <Subsidies />
    </React.StrictMode>,
    document.getElementById('root')
  );
} else {
  ReactDOM.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
    document.getElementById('root')
  );
}


