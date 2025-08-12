import React from 'react';
import { useTranslation } from 'react-i18next';
// Import your SCSS file
import './DataDeletionPage.scss'; 

const DataDeletionPage = () => {
  const { t } = useTranslation();
  
  return (
    <div className="data-deletion-page">
      <div className="deletion-card">
        <h1>
          {t('dataDeletion.title')}
        </h1>
        <p>
          {t('dataDeletion.intro')}
        </p>

        <ol className="info-list">
          <li>
            {t('dataDeletion.step1_text1')}
            {" "}
            <a href="https://www.facebook.com/settings?tab=applications" target="_blank" rel="noopener noreferrer">
              {t('dataDeletion.step1_linkText')}
            </a>
            . {t('dataDeletion.step1_text2')}
          </li>
          <li>
            {t('dataDeletion.step2_text')}
            <br />
            <a href="mailto:jumpwithjenny.kj@gmail.com" className="email-link">
               jumpwithjenny.kj@gmail.com
            </a>
          </li>
        </ol>

        <p>
          {t('dataDeletion.footer')}
        </p>
      </div>
    </div>
  );
};

export default DataDeletionPage;