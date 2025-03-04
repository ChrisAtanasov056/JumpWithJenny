import React from 'react';
import './Welcome.scss'; // Import the SCSS file for styling

const Welcome = () => {
  return (
    <section id="welcome">
      <div className="welcome-container">
        <h1>Welcome to Jump With Jenny!</h1>
        <p>
        Welcome to my Kangoo Jump classes, where fun, fitness, and results come together to help you feel stronger and more energized!
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