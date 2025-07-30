import React from 'react';
import ReactDOM from 'react-dom/client';

import 'bootstrap/dist/css/bootstrap.min.css';

import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

import './index.css';

import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
const nonce = document.querySelector('meta[name="csp-nonce"]')?.getAttribute('content');
if (nonce) {
  document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
    link.setAttribute('nonce', nonce);
  });
}
root.render(
  <App cspNonce={nonce}/>
);

reportWebVitals();
