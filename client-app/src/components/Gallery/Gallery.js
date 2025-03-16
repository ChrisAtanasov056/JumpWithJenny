import React, { useState, useEffect } from 'react';
import axios from '../../api/axius';
import Slider from 'react-slick';
import Modal from 'react-modal';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import './Gallery.scss';

const baseUrl = 'https://localhost:7024'; // Replace with your backend URL

// Modal styles
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
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  // Fetch images from your backend
  const fetchImages = async (pageNumber) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`/Gallery?page=${pageNumber}&limit=8`);
      console.log('API Response:', response.data); // Debugging

      const newImages = response.data.map((img) => ({
        ...img,
        url: `${baseUrl}${img.Url}`, // Construct full URL
      }));

      console.log('Transformed Images:', newImages); // Debugging

      if (newImages.length === 0) {
        setHasMore(false); // No more images to load
      } else {
        setImages((prev) => [...prev, ...newImages]);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load initial images
  useEffect(() => {
    fetchImages(page);
  }, []);

  // Fetch new images when page changes
  useEffect(() => {
    if (page > 1) {
      fetchImages(page);
    }
  }, [page]);

  // Open modal with selected image
  const openModal = (image) => {
    setSelectedImage(image);
  };

  // Close modal
  const closeModal = () => {
    setSelectedImage(null);
  };

  // Carousel settings
  const settings = {
    dots: false,
    infinite: true,
    speed: 700,
    slidesToShow: 3,
    slidesToScroll: 1,
    centerMode: true,
    centerPadding: '0',
    focusOnSelect: true,
    draggable: true, // Enable mouse dragging
    swipeToSlide: true, // Enable swipe gestures
    touchThreshold: 50, // Increase sensitivity for touch/drag
    swipeThreshold: 50,
    arrows: true,
    arrowaitForAnimate: false,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  };

  return (
    <section className="gallery-section" id="gallery">
      <div className="section-header">
        <h2>Photo Gallery</h2>
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
                  alt={`Gallery item ${index + 1}`} 
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
      {/* Modal for full-size image */}
      {/* <Modal
        isOpen={!!selectedImage}
        onRequestClose={closeModal}
        style={customStyles}
        contentLabel="Image Modal"
      >
        {selectedImage && (
          <img
            src={selectedImage.url}
            alt="Full-size image"
            className="modal-image"
          />
        )}
      </Modal> */}
    </section>
  );
};

export default GallerySection;