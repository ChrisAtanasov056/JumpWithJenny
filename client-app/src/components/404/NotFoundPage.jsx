import React, { useMemo, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import './NotFoundPage.scss';

const NotFoundPage = () => {
  const containerRef = useRef(null);

  const particles = useMemo(
    () =>
      Array.from({ length: 15 }, (_, i) => ({
        id: i,
        delay: `${i * 0.2}s`,
        left: `${((i * 37 + 13) % 95) + 2}%`,
      })),
    []
  );

  useEffect(() => {
    const canHover = window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!canHover || prefersReducedMotion) return;

    let rafId = null;
    const handleMouseMove = (e) => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        if (!containerRef.current) return;
        const x = (e.clientX / window.innerWidth) * 100;
        const y = (e.clientY / window.innerHeight) * 100;
        containerRef.current.style.setProperty('--mouse-x', `${x}`);
        containerRef.current.style.setProperty('--mouse-y', `${y}`);
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div ref={containerRef} className="not-found-container">
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="background-elements" aria-hidden="true">
        <div className="floating-shape shape-1"></div>
        <div className="floating-shape shape-2"></div>
        <div className="floating-shape shape-3"></div>
      </div>

      <div className="not-found-content">
        <div className="not-found-code-container">
          <h1 className="not-found-code">
            4
            <span className="zero">0</span>
            4
          </h1>
          <div className="pulse-ring" aria-hidden="true"></div>
        </div>

        <div className="text-content">
          <h2 className="not-found-title">Страницата не беше намерена</h2>
          <p className="not-found-message">
            Изглежда, че търсеният от Вас адрес не съществува.
          </p>

          <Link to="/" className="not-found-link">
            <span className="link-text">Обратно към началната страница</span>
            <span className="link-arrow" aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="particles" aria-hidden="true">
          {particles.map((particle) => (
            <div
              key={particle.id}
              className="particle"
              style={{
                animationDelay: particle.delay,
                left: particle.left,
              }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
