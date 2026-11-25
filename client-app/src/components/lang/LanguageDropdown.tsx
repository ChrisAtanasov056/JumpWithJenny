import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageDropdown.scss';

const LANGUAGES = [
  { code: 'bg', name: 'Български', flag: '🇧🇬' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
];

const LanguageDropdown = () => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const rawLang = i18n.resolvedLanguage || i18n.language || 'bg';
  const currentCode = rawLang.split('-')[0];
  const currentLanguage =
    LANGUAGES.find((lang) => lang.code === currentCode) || LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (event: PointerEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div
      ref={dropdownRef}
      className={`language-dropdown ${isOpen ? 'active' : ''}`}
    >
      <button
        type="button"
        className="selected-language"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={t('navbar.languageSelect')}
      >
        <span aria-hidden="true">{currentLanguage.flag}</span>
        <span className="language-code">{currentLanguage.code.toUpperCase()}</span>
        <span className="chevron" aria-hidden="true">▾</span>
      </button>

      {isOpen && (
        <div className="language-options" role="listbox" aria-label={t('navbar.languageSelect')}>
          {LANGUAGES.map((language) => (
            <button
              key={language.code}
              type="button"
              role="option"
              aria-selected={currentCode === language.code}
              className={`language-option ${currentCode === language.code ? 'active' : ''}`}
              onClick={() => {
                i18n.changeLanguage(language.code);
                setIsOpen(false);
              }}
            >
              <span aria-hidden="true">{language.flag}</span>
              <span>{language.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageDropdown;
