// src/components/AboutMe/AboutMe.js
import React from 'react';
import './AboutMe.css';

const AboutMe = () => (
  <section id="about" className="about-section">
    <div className="about-text">
      <h2>About Me</h2>
      <p>Here is some information about me...</p>
    </div>
    <div className="about-image">
      <img src="../../../images/person_1.jpg" alt="About Me" />
    </div>
  </section>
);

export default AboutMe;
