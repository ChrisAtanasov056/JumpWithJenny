export const COOKIE_CONSENT_STORAGE_KEY = 'jwj_cookie_consent_v1';
export const CONSENT_SCHEMA_VERSION = 1;
export const GA_MEASUREMENT_ID = 'G-P8NNLSQC83';
export const GA_SCRIPT_ID = 'jwj-ga4-script';

const FUNCTIONAL_STORAGE_KEYS = ['jwj_booking_prefs_v2', 'jwj_booking_prefs_v1'];

let gaConfigured = false;

/**
 * Loads and validates the saved cookie consent preferences from localStorage.
 * Returns null when the visitor has not made a valid choice yet.
 */
export const loadCookieConsent = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      parsed.version !== CONSENT_SCHEMA_VERSION ||
      typeof parsed.functional !== 'boolean' ||
      typeof parsed.analytics !== 'boolean'
    ) {
      return null;
    }

    return {
      version: CONSENT_SCHEMA_VERSION,
      necessary: true,
      functional: parsed.functional,
      analytics: parsed.analytics,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : '',
    };
  } catch {
    return null;
  }
};

/**
 * Returns true only when the visitor explicitly allowed functional storage/embeds.
 */
export const hasFunctionalConsent = () => Boolean(loadCookieConsent()?.functional);

/**
 * Expires Google Analytics cookies across the current host and root domain.
 */
export const clearAnalyticsCookies = () => {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return;
  }

  const cookieNames = new Set(['_ga', '_gid', '_gat']);
  const existingCookies = document.cookie ? document.cookie.split(';') : [];

  existingCookies.forEach((entry) => {
    const [rawName] = entry.split('=');
    const name = rawName ? rawName.trim() : '';
    if (name === '_ga' || name.startsWith('_ga_') || name === '_gid' || name.startsWith('_gat')) {
      cookieNames.add(name);
    }
  });

  const hostname = window.location.hostname;
  const hostParts = hostname ? hostname.split('.') : [];
  const domains = [''];

  if (hostname) {
    domains.push(hostname, `.${hostname}`);
  }
  if (hostParts.length >= 2) {
    const rootDomain = hostParts.slice(-2).join('.');
    domains.push(rootDomain, `.${rootDomain}`);
  }

  cookieNames.forEach((name) => {
    domains.forEach((domain) => {
      const domainAttr = domain ? `; domain=${domain}` : '';
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domainAttr}; SameSite=Lax`;
    });
  });
};

/**
 * Removes optional functional localStorage entries when functional consent is withdrawn.
 */
export const clearFunctionalStorage = () => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    FUNCTIONAL_STORAGE_KEYS.forEach((key) => {
      window.localStorage.removeItem(key);
    });
  } catch {
    // Ignore storage access errors in restricted browsing modes
  }
};

const ensureGtag = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== 'function') {
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
  }
};

/**
 * Applies consent side effects for Google Analytics 4 and functional storage.
 */
export const applyCookieConsentEffects = (consent) => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  ensureGtag();

  if (consent?.analytics === true) {
    window[`ga-disable-${GA_MEASUREMENT_ID}`] = false;
    window.gtag('consent', 'update', {
      analytics_storage: 'granted',
    });

    if (!document.getElementById(GA_SCRIPT_ID)) {
      const script = document.createElement('script');
      script.id = GA_SCRIPT_ID;
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
      document.head.appendChild(script);
    }

    if (!gaConfigured) {
      window.gtag('js', new Date());
      window.gtag('config', GA_MEASUREMENT_ID, { anonymize_ip: true });
      gaConfigured = true;
    }
  } else {
    window[`ga-disable-${GA_MEASUREMENT_ID}`] = true;
    window.gtag('consent', 'update', {
      analytics_storage: 'denied',
    });
    clearAnalyticsCookies();
  }

  if (consent && consent.functional === false) {
    clearFunctionalStorage();
  }
};

/**
 * Persists cookie preferences to localStorage and immediately applies consent effects.
 */
export const saveCookieConsent = ({ functional, analytics }) => {
  const payload = {
    version: CONSENT_SCHEMA_VERSION,
    necessary: true,
    functional: Boolean(functional),
    analytics: Boolean(analytics),
    updatedAt: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage quota or privacy mode errors
    }
  }

  applyCookieConsentEffects(payload);
  return payload;
};
