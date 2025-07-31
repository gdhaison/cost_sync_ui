import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

ReactDOM.render(
  <React.StrictMode>
  <div style={{
  width: '100%',
  maxWidth: '100vw',
  overflowX: 'hidden',
  boxSizing: 'border-box',
  paddingLeft: '-8px',
  paddingRight: '10px'
}}>
  <App />
</div>
  </React.StrictMode>,
  document.getElementById('root')
);

if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    });
  });
}