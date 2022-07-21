// src/components/FAQ/FAQ.js
import React, { useState } from 'react';
import './FAQ.css'; // Import the CSS file

const FAQ = () => {
  // Sample FAQs
  const faqData = [
    {
      question: "What is your return policy?",
      answer: "Our return policy allows you to return products within 30 days of purchase with a full refund."
    },
    {
      question: "How do I schedule an appointment?",
      answer: "You can schedule an appointment through our online system or by calling our support team."
    },
    {
      question: "Do you offer discounts for new members?",
      answer: "Yes, we offer a 10% discount for all new members during their first month."
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
              <div className="faq-answer">
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
