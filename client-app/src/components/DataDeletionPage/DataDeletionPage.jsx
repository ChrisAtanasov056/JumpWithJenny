import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import './DataDeletionPage.scss';

const DataDeletionPage = () => {
  const { t } = useTranslation();
  
  return (
    <div className="data-deletion-page">
      <div className="deletion-card">
        <h1>
          {t('dataDeletion.title')}
        </h1>
        
        <div className="intro-section">
          <p>
            {t('dataDeletion.intro')}
          </p>
        </div>

        <div className="deletion-instructions">
          <h2>{t('dataDeletion.howToDelete')}</h2>
          
          <div className="instruction-step">
            <div className="step-number">1</div>
            <div className="step-content">
              <p>{t('dataDeletion.step1')}</p>
            </div>
          </div>

          <div className="instruction-step">
            <div className="step-number">2</div>
            <div className="step-content">
              <p>{t('dataDeletion.step2')}</p>
              <div className="email-section">
                <a href="mailto:jumpwithjenny.kj@gmail.com" className="email-link">
                  jumpwithjenny.kj@gmail.com
                </a>
              </div>
            </div>
          </div>

          <div className="instruction-step">
            <div className="step-number">3</div>
            <div className="step-content">
              <p>{t('dataDeletion.step3')}</p>
            </div>
          </div>
        </div>

        <div className="confirmation-section">
          <p>
            {t('dataDeletion.confirmation')}
          </p>
        </div>

        <div className="back-button-container">
          <Link to="/" className="back-button">
            ← {t('dataDeletion.backButton')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DataDeletionPage;