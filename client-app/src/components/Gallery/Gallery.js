import React, { useState, useEffect } from 'react';
import axios from '../../api/axius';
import Slider from 'react-slick';
import Modal from 'react-modal';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import './Gallery.scss';
import { useTranslation } from 'react-i18next'; // ✅ Import

import { API_BASE_URL } from '../../api/axios';  

const baseUrl = API_BASE_URL;

const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    padding: '0',
    border: 'none',
    borderRadius: '10px',
    overflow: 'hidden',
    maxWidth: '90%',
    maxHeight: '90%',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
};

const GallerySection = () => {
  const { t } = useTranslation(); // ✅ Use translation hook

  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  const fetchImages = async (pageNumber) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`/Gallery?page=${pageNumber}&limit=8`);
      const newImages = response.data.map((img) => ({
        ...img,
        url: `${baseUrl}${img.Url}`,
      }));

      if (newImages.length === 0) {
        setHasMore(false);
      } else {
        setImages((prev) => [...prev, ...newImages]);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchImages(page);
  }, []);

  useEffect(() => {
    if (page > 1) {
      fetchImages(page);
    }
  }, [page]);

  const openModal = (image) => setSelectedImage(image);
  const closeModal = () => setSelectedImage(null);

  const settings = {
    dots: false,
    infinite: true,
    speed: 700,
    slidesToShow: 3,
    slidesToScroll: 1,
    centerMode: true,
    centerPadding: '0',
    focusOnSelect: true,
    draggable: true,
    swipeToSlide: true,
    touchThreshold: 50,
    swipeThreshold: 50,
    arrows: true,
    arrowWaitForAnimate: false,
    responsive: [
      {
        breakpoint: 1024,
        settings: { slidesToShow: 3, slidesToScroll: 1 },
      },
      {
        breakpoint: 768,
        settings: { slidesToShow: 1, slidesToScroll: 1 },
      },
    ],
  };

  return (
    <section className="gallery-section" id="gallery">
      <div className="section-header">
        <h2>{t('galleryTitle')}</h2> {/* ✅ Translated title */}
      </div>

      <div className="gallery-carousel">
        <Slider {...settings}>
          {images.map((img, index) => (
            <div
              className="gallery-item"
              key={index}
              onClick={() => openModal(img)}
            >
              <div className="image-container">
                <img 
                  src={img.url}
                  alt={`${t('galleryAlt')} ${index + 1}`} 
                  loading="lazy"
                  onError={(e) => {
                    e.target.src = 'https://placehold.co/200'; 
                  }}
                />
              </div>
            </div>
          ))}
        </Slider>
      </div>
    </section>
  );
};

export default GallerySection;