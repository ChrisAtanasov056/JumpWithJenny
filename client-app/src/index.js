import React from 'react';
import ReactDOM from 'react-dom/client';

// Импортирай bootstrap css от node_modules
import 'bootstrap/dist/css/bootstrap.min.css';

// Импортирай slick carousel css, ако го ползваш
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

// Твоят собствен css
import './index.css';

import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <App />
);

reportWebVitals();
