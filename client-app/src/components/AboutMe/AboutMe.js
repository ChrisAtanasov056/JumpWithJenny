import React, { useEffect, useRef, useState } from 'react';
import './AboutMe.scss';

const AboutMe = () => {
  const textRef = useRef(null);
  const imageRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target); // Stop observing after animation starts
          }
        });
      },
      { threshold: 0.4 } // Trigger when 40% of the element is visible
    );

    if (textRef.current) observer.observe(textRef.current);
    if (imageRef.current) observer.observe(imageRef.current);

    return () => {
      if (textRef.current) observer.unobserve(textRef.current);
      if (imageRef.current) observer.unobserve(imageRef.current);
    };
  }, []);

  return (
    <section id="about" className="about-section">
      <div
        ref={textRef}
        className={`about-text ${isVisible ? 'active' : ''}`}
      >
        <h2>About Me</h2>
        <p>Hi, I’m Jenny, a certified Kangoo Jump trainer. I’m passionate about combining fitness with fun, and I’ve found Kangoo Jumps to be the perfect way to do that. These low-impact, high-energy workouts are great for improving cardio, strength, and flexibility while keeping things exciting!

I love helping people of all fitness levels feel confident and motivated. Whether you’re new to fitness or an experienced athlete, my classes are designed to energize and challenge you in a fun way.

Join me for a Kangoo Jump session and experience a workout that’s as enjoyable as it is effective!</p>
      </div>
      <div
        ref={imageRef}
        className={`about-image ${isVisible ? 'active' : ''}`}
      >
        <img src="../../../images/jenny.jpg" alt="About Me" />
      </div>
    </section>
  );
};

export default AboutMe;