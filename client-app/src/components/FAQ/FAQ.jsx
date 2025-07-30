import React, { useState } from 'react';
import { useTranslation } from 'react-i18next'; // ← Add this
import './FAQ.scss';

const FAQ = () => {
  const { t } = useTranslation(); // ← Add this

  const faqData = [
    {
      question: t('faq.q1'),
      answer: t('faq.a1'),
    },
    {
      question: t('faq.q2'),
      answer: t('faq.a2'),
    },
    {
      question: t('faq.q3'),
      answer: t('faq.a3'),
    },
    {
      question: t('faq.q4'),
      answer: t('faq.a4'),
    },
  ];

  const [activeIndex, setActiveIndex] = useState(null);

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section id="faq" className="faq-section">
      <h2>{t('faq.title')}</h2>
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