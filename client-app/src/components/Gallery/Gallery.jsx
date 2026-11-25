import React, { useState, useEffect, useRef } from "react";
import axios, { API_BASE_URL } from "../../api/axius";
import Slider from "react-slick";
import { motion, useAnimation } from "framer-motion";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./Gallery.scss";
import { useTranslation } from "react-i18next";

const baseUrl = API_BASE_URL;
const PAGE_SIZE = 9;

const Gallery = () => {
  const { t } = useTranslation();
  const [images, setImages] = useState([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoadingGallery, setIsLoadingGallery] = useState(true);
  const [isCompactViewport, setIsCompactViewport] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= 768 : false
  );
  const [currentIndex, setCurrentIndex] = useState(0);

  const controls = useAnimation();
  const ref = useRef(null);
  const sliderRef = useRef(null);

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    const handleResize = () => {
      setIsCompactViewport(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      controls.start("visible");
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          controls.start("visible");
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [controls, prefersReducedMotion]);

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
          url: `${baseUrl}${img.Url}`,
        }));

        setImages(pageItems);
        setHasNextPage(hasMore);
        setCurrentIndex(0);
        if (sliderRef.current && typeof sliderRef.current.slickGoTo === "function") {
          sliderRef.current.slickGoTo(0, true);
        }
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

  const count = images.length;
  const desktopSlides = Math.min(3, Math.max(1, count));
  const tabletSlides = Math.min(2, Math.max(1, count));

  const settings = {
    dots: count > 1,
    infinite: count > 3,
    autoplay: !prefersReducedMotion && count > 1,
    autoplaySpeed: 3000,
    speed: prefersReducedMotion ? 0 : 700,
    slidesToShow: desktopSlides,
    slidesToScroll: 1,
    centerMode: count >= 3,
    centerPadding: "0px",
    pauseOnHover: true,
    arrows: false,
    beforeChange: (_, newIndex) => setCurrentIndex(newIndex),
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: tabletSlides, centerMode: false } },
      { breakpoint: 768, settings: { slidesToShow: 1, centerMode: false } },
    ],
  };

  const getScale = (index) => {
    if (isCompactViewport || count < 3) return 1;
    return index === currentIndex ? 1 : 0.9;
  };

  return (
    <motion.section
      id="gallery"
      className="modern-gallery"
      aria-labelledby="gallery-title"
      ref={ref}
      initial={prefersReducedMotion ? "visible" : "hidden"}
      animate={controls}
      variants={{
        hidden: { opacity: 0, y: 40 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: prefersReducedMotion ? 0 : 0.8 },
        },
      }}
    >
      <h2 id="gallery-title" className="gallery-title">
        {t("galleryTitle")}
      </h2>

      {count > 0 && (
        <div className="gallery-slider-wrapper">
          {count > 1 && (
            <button
              type="button"
              className="gallery-arrow-btn prev"
              aria-label={t("galleryPrevSlide")}
              onClick={() => sliderRef.current?.slickPrev()}
            >
              <FaChevronLeft aria-hidden="true" />
            </button>
          )}

          <Slider ref={sliderRef} {...settings}>
            {images.map((img, i) => (
              <div
                className={`gallery-card ${i === currentIndex ? "is-active" : ""}`}
                key={img.Id || i}
              >
                <div
                  className="gallery-img-wrap"
                  style={{
                    transform: `scale(${getScale(i)})`,
                  }}
                >
                  <img
                    src={img.url}
                    alt={img.Name || `${t("galleryAlt")} ${i + 1}`}
                    loading="lazy"
                  />
                </div>
              </div>
            ))}
          </Slider>

          {count > 1 && (
            <button
              type="button"
              className="gallery-arrow-btn next"
              aria-label={t("galleryNextSlide")}
              onClick={() => sliderRef.current?.slickNext()}
            >
              <FaChevronRight aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      {(page > 1 || hasNextPage) && (
        <nav className="gallery-pagination" aria-label={t("galleryPagination")}>
          <button
            type="button"
            className="gallery-page-btn"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || isLoadingGallery}
          >
            {t("galleryPrevPage")}
          </button>
          <span className="gallery-page-indicator">
            {t("galleryPageInfo", { page })}
          </span>
          <button
            type="button"
            className="gallery-page-btn"
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasNextPage || isLoadingGallery}
          >
            {t("galleryNextPage")}
          </button>
        </nav>
      )}
    </motion.section>
  );
};

export default Gallery;
