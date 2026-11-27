import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  applyCookieConsentEffects,
  loadCookieConsent,
  saveCookieConsent,
} from './cookieConsent';

const CookieConsentContext = createContext(null);

/**
 * Provides global GDPR cookie consent state and preference modal controls.
 */
export const CookieConsentProvider = ({ children }) => {
  const [consent, setConsent] = useState(() => loadCookieConsent());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    applyCookieConsentEffects(consent);
  }, [consent]);

  const openSettings = useCallback(() => {
    setIsSettingsOpen(true);
  }, []);

  const closeSettings = useCallback(() => {
    setIsSettingsOpen(false);
  }, []);

  const acceptAll = useCallback(() => {
    const saved = saveCookieConsent({ functional: true, analytics: true });
    setConsent(saved);
    setIsSettingsOpen(false);
  }, []);

  const rejectOptional = useCallback(() => {
    const saved = saveCookieConsent({ functional: false, analytics: false });
    setConsent(saved);
    setIsSettingsOpen(false);
  }, []);

  const savePreferences = useCallback(({ functional, analytics }) => {
    const saved = saveCookieConsent({ functional, analytics });
    setConsent(saved);
    setIsSettingsOpen(false);
  }, []);

  const enableFunctional = useCallback(() => {
    const saved = saveCookieConsent({
      functional: true,
      analytics: Boolean(consent?.analytics),
    });
    setConsent(saved);
  }, [consent?.analytics]);

  const value = useMemo(
    () => ({
      consent,
      hasChosen: Boolean(consent),
      functionalAllowed: Boolean(consent?.functional),
      analyticsAllowed: Boolean(consent?.analytics),
      isSettingsOpen,
      openSettings,
      closeSettings,
      acceptAll,
      rejectOptional,
      savePreferences,
      enableFunctional,
    }),
    [
      consent,
      isSettingsOpen,
      openSettings,
      closeSettings,
      acceptAll,
      rejectOptional,
      savePreferences,
      enableFunctional,
    ]
  );

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
    </CookieConsentContext.Provider>
  );
};

export const useCookieConsent = () => {
  const context = useContext(CookieConsentContext);
  if (!context) {
    throw new Error('useCookieConsent must be used within a CookieConsentProvider');
  }
  return context;
};
