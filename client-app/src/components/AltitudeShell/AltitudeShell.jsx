import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import './AltitudeShell.scss';

const clamp01 = (value) => Math.max(0, Math.min(1, value));

const AltitudeShell = ({ showAltimeter = false, children }) => {
  const { t } = useTranslation();
  const skyRef = useRef(null);
  const dawnRef = useRef(null);
  const nightRef = useRef(null);
  const meterRef = useRef(null);
  const meterNumRef = useRef(null);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    let rafId = null;
    let stopTimer = null;

    const updateProgress = () => {
      rafId = null;
      const docEl = document.documentElement;
      const maxScroll = Math.max(1, docEl.scrollHeight - window.innerHeight);
      const progress = clamp01(window.scrollY / maxScroll);

      if (skyRef.current) {
        skyRef.current.style.setProperty('--p', String(progress));
      }
      if (dawnRef.current) {
        dawnRef.current.style.opacity = String(clamp01(1 - progress * 2.6));
      }
      if (nightRef.current) {
        nightRef.current.style.opacity = String(clamp01((progress - 0.45) * 2.4));
      }
      if (meterRef.current) {
        meterRef.current.style.setProperty('--p', String(progress));
      }
      if (meterNumRef.current) {
        meterNumRef.current.textContent = String(Math.round(progress * 1200));
      }
    };

    const handleScroll = () => {
      if (!prefersReducedMotion && meterRef.current) {
        meterRef.current.classList.add('is-moving');
        window.clearTimeout(stopTimer);
        stopTimer = window.setTimeout(() => {
          meterRef.current?.classList.remove('is-moving');
        }, 150);
      }

      if (!rafId) {
        rafId = window.requestAnimationFrame(updateProgress);
      }
    };

    updateProgress();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', updateProgress, { passive: true });

    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            if (!rafId) {
              rafId = window.requestAnimationFrame(updateProgress);
            }
          })
        : null;

    if (resizeObserver && document.body) {
      resizeObserver.observe(document.body);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateProgress);
      window.clearTimeout(stopTimer);
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
      resizeObserver?.disconnect();
    };
  }, [showAltimeter]);

  return (
    <div className="altitude-public">
      {/* Shared SVG clip-path definition for organic schedule cloud cards */}
      <svg width="0" height="0" className="alt-svg-defs" aria-hidden="true">
        <defs>
          <clipPath id="jwj-cloud-clip" clipPathUnits="objectBoundingBox">
            <path d="M 0.04,0.96 C 0.01,0.96 0,0.90 0,0.82 L 0,0.28 C 0,0.16 0.09,0.11 0.21,0.14 C 0.28,0.02 0.54,-0.01 0.65,0.10 C 0.77,0.05 0.98,0.11 1,0.26 L 1,0.82 C 1,0.90 0.99,0.96 0.96,0.96 Z" />
          </clipPath>
        </defs>
      </svg>

      {/* Fixed dynamic sky backdrop (dawn -> daytime -> starry night) */}
      <div className="alt-sky" ref={skyRef} aria-hidden="true">
        <div className="alt-sky__day" />
        <div className="alt-sky__dawn" ref={dawnRef} />
        <div className="alt-sky__night" ref={nightRef} />
        <div className="alt-sky__sun" />
        <div className="alt-sky__noise" />
      </div>

      {/* Scroll altimeter with jumping Kangoo boot marker */}
      {showAltimeter && (
        <aside className="alt-meter" ref={meterRef} aria-hidden="true">
          <b className="alt-meter__num" ref={meterNumRef}>
            0
          </b>
          <span className="alt-meter__unit">{t('altitude.altimeterUnit')}</span>
          <div className="alt-meter__track">
            <svg className="alt-meter__marker" viewBox="0 0 28 28" width="28" height="28">
              <g className="boot-body">
                <path
                  d="M8 4h8v8l4 2c1.4.7 2 1.8 2 3v2H7V5.5C7 4.7 7.4 4 8 4z"
                  fill="#ff6a3d"
                />
                <rect x="6" y="18" width="17" height="3" rx="1.5" fill="#fff" />
              </g>
              <g className="boot-spring">
                <path
                  d="M9 21l10 1.8L9 24.6l10 1.8L9 27.6"
                  fill="none"
                  stroke="#ffd23f"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            </svg>
          </div>
          <div className="alt-meter__mobile-bar" />
        </aside>
      )}

      <div className="alt-content">{children}</div>
    </div>
  );
};

export default AltitudeShell;
