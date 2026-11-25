import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FaChevronLeft, FaChevronRight, FaTimes } from 'react-icons/fa';
import axios, { API_BASE_URL } from '../../api/axius';
import useModalAccessibility from '../../services/useModalAccessibility';
import './Gallery.scss';

const PAGE_SIZE = 9;

const getSlidePosition = (index, activeIndex, total) => {
  if (total <= 1 || index === activeIndex) return '0';
  if (total === 2) return '1';
  let diff = (index - activeIndex + total) % total;
  if (diff > total / 2) diff -= total;
  if (diff === -1) return '-1';
  if (diff === 1) return '1';
  return 'far';
};

const Gallery = () => {
  const { t } = useTranslation();
  const [images, setImages] = useState([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoadingGallery, setIsLoadingGallery] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const touchStartRef = useRef({ x: null, y: null });
  const lightboxRef = useRef(null);

  const isLightboxOpen = lightboxIndex !== null && images.length > 0;

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null);
  }, []);

  useModalAccessibility({
    isOpen: isLightboxOpen,
    onClose: closeLightbox,
    modalRef: lightboxRef,
  });

  useEffect(() => {
    let isCancelled = false;
    setIsLoadingGallery(true);

    axios
      .get(`/Gallery?page=${page}&pageSize=${PAGE_SIZE + 1}`)
      .then((res) => {
        if (isCancelled) return;
        const rows = Array.isArray(res.data) ? res.data : [];
        const hasMore = rows.length > PAGE_SIZE;
        const pageItems = rows.slice(0, PAGE_SIZE).map((img) => ({
          ...img,
          url: `${API_BASE_URL}${img.Url}`,
        }));

        setImages(pageItems);
        setHasNextPage(hasMore);
        setCurrentIndex(0);
        setLightboxIndex(null);
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error(err);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoadingGallery(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [page]);

  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setLightboxIndex((prev) => (prev - 1 + images.length) % images.length);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        setLightboxIndex((prev) => (prev + 1) % images.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, images.length]);

  const count = images.length;
  const safeIndex = count > 0 ? currentIndex % count : 0;

  const stepFocus = useCallback(
    (delta) => {
      if (count <= 1) return;
      setCurrentIndex((prev) => (prev + delta + count) % count);
    },
    [count]
  );

  const handleTouchStart = (event) => {
    const touch = event.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event) => {
    const { x: startX, y: startY } = touchStartRef.current;
    if (startX === null || startY === null) return;

    const touch = event.changedTouches[0];
    const diffX = startX - touch.clientX;
    const diffY = startY - touch.clientY;
    if (Math.abs(diffX) > 45 && Math.abs(diffX) > Math.abs(diffY)) {
      stepFocus(diffX > 0 ? 1 : -1);
    }
    touchStartRef.current = { x: null, y: null };
  };

  const activeLightboxImg =
    isLightboxOpen ? images[lightboxIndex % images.length] : null;

  return (
    <section
      id="gallery"
      className="alt-section gallery-section"
      aria-labelledby="gallery-title"
    >
      <div className="alt-wrap">
        <div className="gallery-header">
          <h2 id="gallery-title" className="alt-section-title">
            {t('galleryTitle')}
          </h2>
          <p className="gallery-subtitle">{t('gallerySubtitle')}</p>
        </div>

        {isLoadingGallery && count === 0 && (
          <div className="gallery-loading" role="status">
            {t('common.loading')}
          </div>
        )}

        {count > 0 && (
          <div className="gallery-focus-wrap">
            <div
              className="gallery-focus-stage"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {images.map((img, i) => {
                const pos = getSlidePosition(i, safeIndex, count);
                const isCenter = pos === '0';
                const label = isCenter
                  ? t('gallery.openLightbox', { index: i + 1 })
                  : img.Name || `${t('galleryAlt')} ${i + 1}`;

                return (
                  <button
                    key={img.Id || i}
                    type="button"
                    className="gallery-focus-slide"
                    data-pos={pos}
                    aria-label={label}
                    tabIndex={pos === 'far' ? -1 : 0}
                    onClick={() => {
                      if (isCenter) {
                        setLightboxIndex(i);
                      } else {
                        setCurrentIndex(i);
                      }
                    }}
                  >
                    <img
                      src={img.url}
                      alt={img.Name || `${t('galleryAlt')} ${i + 1}`}
                      loading="lazy"
                      decoding="async"
                    />
                  </button>
                );
              })}
            </div>

            {count > 1 && (
              <div className="gallery-controls">
                <button
                  type="button"
                  className="alt-glass-nav-btn"
                  aria-label={t('galleryPrevSlide')}
                  onClick={() => stepFocus(-1)}
                >
                  <FaChevronLeft aria-hidden="true" />
                </button>

                <div className="gallery-dots">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`gallery-dot ${i === safeIndex ? 'is-active' : ''}`}
                      aria-label={t('gallery.openLightbox', { index: i + 1 })}
                      aria-pressed={i === safeIndex}
                      onClick={() => setCurrentIndex(i)}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  className="alt-glass-nav-btn"
                  aria-label={t('galleryNextSlide')}
                  onClick={() => stepFocus(1)}
                >
                  <FaChevronRight aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        )}

        {(page > 1 || hasNextPage) && (
          <nav className="gallery-pagination" aria-label={t('galleryPagination')}>
            <button
              type="button"
              className="gallery-page-btn"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || isLoadingGallery}
            >
              {t('galleryPrevPage')}
            </button>
            <span className="gallery-page-indicator">
              {t('galleryPageInfo', { page })}
            </span>
            <button
              type="button"
              className="gallery-page-btn"
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasNextPage || isLoadingGallery}
            >
              {t('galleryNextPage')}
            </button>
          </nav>
        )}
      </div>

      {isLightboxOpen && activeLightboxImg && (
        <div
          className="gallery-lightbox"
          onClick={closeLightbox}
        >
          <div
            ref={lightboxRef}
            className="gallery-lightbox__dialog"
            role="dialog"
            aria-modal="true"
            aria-label={t('galleryTitle')}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="alt-glass-nav-btn gallery-lightbox__close"
              aria-label={t('altitude.gallery.closeLightbox')}
              onClick={closeLightbox}
            >
              <FaTimes aria-hidden="true" />
            </button>

            <img
              src={activeLightboxImg.url}
              alt={activeLightboxImg.Name || `${t('galleryAlt')} ${(lightboxIndex % images.length) + 1}`}
              className="gallery-lightbox__img"
            />

            {count > 1 && (
              <div className="gallery-lightbox__bar">
                <button
                  type="button"
                  className="alt-glass-nav-btn"
                  aria-label={t('galleryPrevSlide')}
                  onClick={() =>
                    setLightboxIndex((prev) => (prev - 1 + images.length) % images.length)
                  }
                >
                  <FaChevronLeft aria-hidden="true" />
                </button>
                <span>
                  {t('altitude.gallery.counter', {
                    current: (lightboxIndex % images.length) + 1,
                    total: images.length,
                  })}
                </span>
                <button
                  type="button"
                  className="alt-glass-nav-btn"
                  aria-label={t('galleryNextSlide')}
                  onClick={() =>
                    setLightboxIndex((prev) => (prev + 1) % images.length)
                  }
                >
                  <FaChevronRight aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default Gallery;
