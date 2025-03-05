import React from 'react';
import './Welcome.scss';

// If your video is in the public folder
const videoSource = "../../images/c095f2709e554927ac41ac0f1598b722.mp4";

const Welcome = () => {
  return (
    <section id="welcome">
      {/* Video background element */}
      <video autoPlay loop muted playsInline className="background-video">
        <source src={videoSource} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
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