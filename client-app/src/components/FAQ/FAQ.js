import React, { useState } from 'react';
import './FAQ.scss'; // Updated import for SCSS

const FAQ = () => {
  // Sample FAQs
  const faqData = [
    {
      question: "What is Kangoo Jump?",
      answer: "Kangoo Jump is a fun and high-intensity workout that uses special rebound shoes designed to reduce impact and increase calorie burn."
    },
    {
      question: "How can I book a Kangoo Jump class?",
      answer: "You can book a class by visiting our schedule page or contacting us directly through the contact form."
    },
    {
      question: "What are the benefits of Kangoo Jump?",
      answer: "Kangoo Jump helps improve cardiovascular fitness, strengthens muscles, and enhances coordination while minimizing joint stress."
    },
    {
      question: "Do I need to bring my own shoes?",
      answer: "We provide Kangoo Jump shoes for all participants, but feel free to bring your own if you prefer."
    }
  ];

  const [activeIndex, setActiveIndex] = useState(null);

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section id="faq" className="faq-section">
      <h2>Frequently Asked Questions</h2>
      <div className="faq-list">
        {faqData.map((item, index) => (
          <div key={index} className="faq-item">
            <div 
              onClick={() => toggleFAQ(index)} 
              className={`faq-question ${activeIndex === index ? 'active' : ''}`}
            >
              {item.question}
            </div>
            {activeIndex === index && (
              <div className={`faq-answer ${activeIndex === index ? 'active' : ''}`}>
                {item.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default FAQ;