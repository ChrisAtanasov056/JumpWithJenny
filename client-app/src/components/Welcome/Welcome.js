// src/components/Welcome/Welcome.js
import React from 'react';
import './Welcome.css'; // Import the CSS file for styling

const Welcome = () => {
  return (
    <section id="welcome">
        <div className="welcome-container">
      <h1>Welcome to Our Service!</h1>
      <p>
        We are glad to have you here. Explore our offerings and make your experience unforgettable.
      </p>
      <p>
        Click the button below to get started.
      </p>
      <button className="get-started-btn">
        Get Started
      </button>
    </div>
    </section>
    
  );
};

export default Welcome;
