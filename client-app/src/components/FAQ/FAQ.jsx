import React from 'react';
import { useTranslation } from 'react-i18next';
import { FaChevronDown } from 'react-icons/fa';
import './FAQ.scss';

const FAQ = () => {
  const { t } = useTranslation();

  const faqData = [
    { question: t('faq.q1'), answer: t('faq.a1') },
    { question: t('faq.q2'), answer: t('faq.a2') },
    { question: t('faq.q3'), answer: t('faq.a3') },
    { question: t('faq.q4'), answer: t('faq.a4') },
  ];

  return (
    <section id="faq" className="faq-section" aria-labelledby="faq-heading">
      <h2 id="faq-heading">{t('faq.title')}</h2>
      <div className="faq-list">
        {faqData.map((item, index) => (
          <details key={index} className="faq-item">
            <summary className="faq-question">
              <span className="faq-question-text">{item.question}</span>
              <FaChevronDown className="icon" aria-hidden="true" />
            </summary>
            <div className="faq-answer">
              <p>{item.answer}</p>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
};

export default FAQ;
