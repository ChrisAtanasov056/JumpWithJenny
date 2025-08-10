import React, { useState, useEffect, useRef } from "react";
import axios from "../../api/axius";
import Slider from "react-slick";
import { motion, useAnimation } from "framer-motion";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./Gallery.scss";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../../api/axius";

const baseUrl = API_BASE_URL;

const GallerySection = () => {
  const { t } = useTranslation();
  const [images, setImages] = useState([]);
  const controls = useAnimation();
  const ref = useRef(null);

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && controls.start("visible"),
      { threshold: 0.4 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [controls]);

  useEffect(() => {
    axios
      .get(`/Gallery?page=1&limit=10`)
      .then((res) =>
        setImages(
          res.data.map((img) => ({ ...img, url: `${baseUrl}${img.Url}` }))
        )
      )
      .catch((err) => console.error(err));
  }, []);

  const settings = {
    dots: true,
    infinite: true,
    autoplay: true,
    autoplaySpeed: 2500,
    speed: 900,
    slidesToShow: 3,
    slidesToScroll: 1,
    centerMode: true,
    centerPadding: "0px",
    pauseOnHover: false,
    arrows: false,
    beforeChange: (oldIndex, newIndex) => setCurrentIndex(newIndex),
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 2 } },
      { breakpoint: 768, settings: { slidesToShow: 1 } },
    ],
  };

  const getScale = (index) => {
    const total = images.length;
    const prevIndex = (currentIndex - 1 + total) % total;
    const nextIndex = (currentIndex + 1) % total;

    if (index === currentIndex) return 1.4;   
    if (index === prevIndex || index === nextIndex) return 0.4; 
    return 0.8; 
  };

  return (
    <motion.section
      className="modern-gallery"
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={{
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
      }}
    >
      <h2 className="gallery-title" style={{ textAlign: "center" }}>
        {t("galleryTitle")}
      </h2>
      <Slider {...settings}>
        {images.map((img, i) => (
          <motion.div
            className="gallery-card"
            key={i}
            whileHover={{ scale: 1.03  }}
            transition={{ duration: 0.1 }}
            style={{ scale: getScale(i), transition: "scale 0.4s ease" }}
          >
            <div
              className="gallery-img-wrap"
              style={{
                backgroundImage: `url(${img.url})`,
              }}
            />
          </motion.div>
        ))}
      </Slider>
    </motion.section>
  );
};

export default GallerySection;
