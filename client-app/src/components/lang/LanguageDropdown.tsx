import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageDropdown.scss';

const LanguageDropdown = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'bg', name: 'Български', flag: '🇧🇬' }
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div 
      ref={dropdownRef}
      className={`language-dropdown ${isOpen ? 'active' : ''}`}
      onClick={() => setIsOpen(!isOpen)}
      style={{ position: 'absolute', right: '20px' }}
    >
      <div className="selected-language">
        {currentLanguage?.flag}
        <span className="language-code">{currentLanguage?.code.toUpperCase()}</span>
        <span className="chevron">▾</span>
      </div>
      
      {isOpen && (
        <div className="language-options">
          {languages.map((language) => (
            <div
              key={language.code}
              className={`language-option ${i18n.language === language.code ? 'active' : ''}`}
              onClick={() => i18n.changeLanguage(language.code)}
            >
              {language.flag} {language.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageDropdown;