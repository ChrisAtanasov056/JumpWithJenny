import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { FaCookieBite, FaSlidersH, FaTimes, FaShieldAlt, FaMapMarkedAlt, FaChartBar } from 'react-icons/fa';
import { useCookieConsent } from '../../services/CookieConsentContext';
import './CookieConsent.scss';

let supportsDisplayTransition;

const canTransitionDisplay = () => {
  if (supportsDisplayTransition !== undefined) {
    return supportsDisplayTransition;
  }
  if (
    typeof window === 'undefined' ||
    !window.CSS?.supports?.('transition-behavior', 'allow-discrete') ||
    !document.body
  ) {
    return false;
  }

  const probe = document.createElement('div');
  probe.style.cssText = 'transition: display 1s allow-discrete !important; display: block;';
  document.body.appendChild(probe);
  window.getComputedStyle(probe).display;
  probe.style.display = 'none';
  supportsDisplayTransition = window.getComputedStyle(probe).display === 'block';
  probe.remove();
  return supportsDisplayTransition;
};

const supportsTopLayerExit = () =>
  typeof window !== 'undefined' &&
  Boolean(window.CSS?.supports?.('overlay', 'auto')) &&
  canTransitionDisplay();

const isPointerOutsideDialog = (event, dialog) => {
  const rect = dialog.getBoundingClientRect();
  return (
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom
  );
};

const CookieConsent = () => {
  const { t } = useTranslation();
  const {
    consent,
    hasChosen,
    isSettingsOpen,
    openSettings,
    closeSettings,
    acceptAll,
    rejectOptional,
    savePreferences,
  } = useCookieConsent();

  const dialogRef = useRef(null);
  const titleId = useId();
  const bannerTitleId = useId();
  const functionalSwitchId = useId();
  const analyticsSwitchId = useId();

  const [draftFunctional, setDraftFunctional] = useState(Boolean(consent?.functional));
  const [draftAnalytics, setDraftAnalytics] = useState(Boolean(consent?.analytics));

  useEffect(() => {
    if (isSettingsOpen) {
      setDraftFunctional(Boolean(consent?.functional));
      setDraftAnalytics(Boolean(consent?.analytics));
    }
  }, [isSettingsOpen, consent]);

  const closeWithAnimation = useCallback(async () => {
    const dialog = dialogRef.current;
    if (!dialog || !dialog.open || dialog.hasAttribute('data-closing')) {
      return;
    }

    if (!supportsTopLayerExit()) {
      dialog.setAttribute('data-closing', '');
      const animations = typeof dialog.getAnimations === 'function'
        ? dialog.getAnimations({ subtree: true })
        : [];
      if (animations.length > 0) {
        await Promise.race([
          Promise.allSettled(animations.map((anim) => anim.finished)),
          new Promise((resolve) => window.setTimeout(resolve, 600)),
        ]);
      }
      if (!dialog.hasAttribute('data-closing')) {
        return;
      }
      dialog.removeAttribute('data-closing');
    }

    if (dialog.open) {
      dialog.close();
    }
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (isSettingsOpen) {
      dialog.removeAttribute('data-closing');
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      closeWithAnimation();
    }
  }, [isSettingsOpen, closeWithAnimation]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return undefined;
    }

    const handleCancel = (event) => {
      event.preventDefault();
      closeWithAnimation();
    };

    const handleClose = () => {
      dialog.removeAttribute('data-closing');
      dialog.returnValue = '';
      closeSettings();
    };

    dialog.addEventListener('cancel', handleCancel);
    dialog.addEventListener('close', handleClose);

    let cleanupBackdropFallback;
    if (!('closedBy' in HTMLDialogElement.prototype)) {
      let pressedOutside = false;

      const handlePointerDown = (event) => {
        pressedOutside = isPointerOutsideDialog(event, dialog);
      };

      const handlePointerUp = (event) => {
        if (pressedOutside && isPointerOutsideDialog(event, dialog)) {
          closeWithAnimation();
        }
        pressedOutside = false;
      };

      dialog.addEventListener('pointerdown', handlePointerDown);
      dialog.addEventListener('pointerup', handlePointerUp);

      cleanupBackdropFallback = () => {
        dialog.removeEventListener('pointerdown', handlePointerDown);
        dialog.removeEventListener('pointerup', handlePointerUp);
      };
    }

    return () => {
      dialog.removeEventListener('cancel', handleCancel);
      dialog.removeEventListener('close', handleClose);
      cleanupBackdropFallback?.();
    };
  }, [closeSettings, closeWithAnimation]);

  const handleSaveSelection = () => {
    savePreferences({
      functional: draftFunctional,
      analytics: draftAnalytics,
    });
  };

  const handlePolicyClick = () => {
    closeSettings();
  };

  return (
    <>
      {!hasChosen && !isSettingsOpen && (
        <aside
          className="jwj-cookie-banner"
          role="region"
          aria-labelledby={bannerTitleId}
        >
          <div className="jwj-cookie-banner__content">
            <div className="jwj-cookie-banner__badge" aria-hidden="true">
              <FaCookieBite />
            </div>
            <div className="jwj-cookie-banner__copy">
              <h2 id={bannerTitleId} className="jwj-cookie-banner__title">
                {t('cookies.banner.title')}
              </h2>
              <p className="jwj-cookie-banner__text">
                {t('cookies.banner.description')}{' '}
                <Link to="/cookie-policy" className="jwj-cookie-banner__link">
                  {t('cookies.banner.policyLink')}
                </Link>
              </p>
            </div>
          </div>

          <div className="jwj-cookie-banner__actions">
            <button
              type="button"
              className="jwj-cookie-btn jwj-cookie-btn--ghost"
              onClick={openSettings}
            >
              <FaSlidersH aria-hidden="true" />
              <span>{t('cookies.banner.customize')}</span>
            </button>
            <button
              type="button"
              className="jwj-cookie-btn jwj-cookie-btn--secondary"
              onClick={rejectOptional}
            >
              {t('cookies.banner.rejectOptional')}
            </button>
            <button
              type="button"
              className="jwj-cookie-btn jwj-cookie-btn--primary"
              onClick={acceptAll}
            >
              {t('cookies.banner.acceptAll')}
            </button>
          </div>
        </aside>
      )}

      <dialog
        ref={dialogRef}
        className="jwj-cookie-dialog"
        closedby="any"
        aria-labelledby={titleId}
      >
        <div className="jwj-cookie-dialog__sheet">
          <button
            type="button"
            className="jwj-cookie-dialog__close"
            onClick={closeWithAnimation}
            aria-label={t('cookies.modal.close')}
          >
            <FaTimes aria-hidden="true" />
          </button>

          <header className="jwj-cookie-dialog__header">
            <span className="jwj-cookie-dialog__eyebrow">
              <FaCookieBite aria-hidden="true" />
              <span>Jump With Jenny</span>
            </span>
            <h1 id={titleId} className="jwj-cookie-dialog__title">
              {t('cookies.modal.title')}
            </h1>
            <p className="jwj-cookie-dialog__subtitle">{t('cookies.modal.subtitle')}</p>
          </header>

          <div className="jwj-cookie-dialog__body">
            <div className="jwj-cookie-categories">
              <div className="jwj-cookie-category">
                <div className="jwj-cookie-category__top">
                  <div className="jwj-cookie-category__heading">
                    <span className="jwj-cookie-category__icon is-necessary" aria-hidden="true">
                      <FaShieldAlt />
                    </span>
                    <span className="jwj-cookie-category__name">
                      {t('cookies.categories.necessary.title')}
                    </span>
                  </div>
                  <span className="jwj-cookie-category__pill">
                    {t('cookies.modal.alwaysActive')}
                  </span>
                </div>
                <p className="jwj-cookie-category__desc">
                  {t('cookies.categories.necessary.description')}
                </p>
              </div>

              <div className="jwj-cookie-category">
                <div className="jwj-cookie-category__top">
                  <label htmlFor={functionalSwitchId} className="jwj-cookie-category__heading">
                    <span className="jwj-cookie-category__icon is-functional" aria-hidden="true">
                      <FaMapMarkedAlt />
                    </span>
                    <span className="jwj-cookie-category__name">
                      {t('cookies.categories.functional.title')}
                    </span>
                  </label>
                  <input
                    id={functionalSwitchId}
                    type="checkbox"
                    role="switch"
                    className="jwj-cookie-switch"
                    checked={draftFunctional}
                    onChange={(e) => setDraftFunctional(e.target.checked)}
                    aria-label={t('cookies.categories.functional.title')}
                  />
                </div>
                <p className="jwj-cookie-category__desc">
                  {t('cookies.categories.functional.description')}
                </p>
              </div>

              <div className="jwj-cookie-category">
                <div className="jwj-cookie-category__top">
                  <label htmlFor={analyticsSwitchId} className="jwj-cookie-category__heading">
                    <span className="jwj-cookie-category__icon is-analytics" aria-hidden="true">
                      <FaChartBar />
                    </span>
                    <span className="jwj-cookie-category__name">
                      {t('cookies.categories.analytics.title')}
                    </span>
                  </label>
                  <input
                    id={analyticsSwitchId}
                    type="checkbox"
                    role="switch"
                    className="jwj-cookie-switch"
                    checked={draftAnalytics}
                    onChange={(e) => setDraftAnalytics(e.target.checked)}
                    aria-label={t('cookies.categories.analytics.title')}
                  />
                </div>
                <p className="jwj-cookie-category__desc">
                  {t('cookies.categories.analytics.description')}
                </p>
              </div>
            </div>

            <p className="jwj-cookie-dialog__policy-row">
              <Link
                to="/cookie-policy"
                className="jwj-cookie-dialog__policy-link"
                onClick={handlePolicyClick}
              >
                {t('cookies.modal.policyLink')}
              </Link>
            </p>
          </div>

          <footer className="jwj-cookie-dialog__footer">
            <button
              type="button"
              className="jwj-cookie-modal-btn jwj-cookie-modal-btn--secondary"
              onClick={rejectOptional}
            >
              {t('cookies.modal.rejectOptional')}
            </button>
            <button
              type="button"
              className="jwj-cookie-modal-btn jwj-cookie-modal-btn--outline"
              onClick={handleSaveSelection}
            >
              {t('cookies.modal.saveSelection')}
            </button>
            <button
              type="button"
              className="jwj-cookie-modal-btn jwj-cookie-modal-btn--primary"
              onClick={acceptAll}
            >
              {t('cookies.modal.acceptAll')}
            </button>
          </footer>
        </div>
      </dialog>
    </>
  );
};

export default CookieConsent;
