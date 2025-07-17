import React, { useState, useEffect } from 'react';
import './HappyCustomers.scss';

const HappyCustomers = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const testimonials = [
    {
      id: 1,
      name: 'Иван Петров',
      role: 'Спортист',
      comment: 'Невероятни резултати за кратко време! Професионален подход и перфектна организация.',
      rating: 5,
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
    },
    {
      id: 2,
      name: 'Мария Иванова',
      role: 'Фитнес инструктор',
      comment: 'Най-доброто място за тренировки. Персонализиран подход към всеки клиент и видими резултати.',
      rating: 4,
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg'
    },
    {
      id: 3,
      name: 'Георги Димитров',
      role: 'Аматьор',
      comment: 'Доволен съм от постигнатите резултати. Препоръчвам на всички, които искат да подобрят формата си!',
      rating: 5,
      avatar: 'https://randomuser.me/api/portraits/men/75.jpg'
    }
  ];

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + testimonials.length) % testimonials.length);
  };

  useEffect(() => {
    if (!isHovered) {
      const interval = setInterval(() => {
        nextSlide();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isHovered]);

  return (
    <section className="carousel-section">
      <div className="container">
        <h2 className="title">Доволни клиенти</h2>
        
        <div 
          className="carousel-container"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <button className="arrow prev" onClick={prevSlide}>&lt;</button>
          
          <div className="carousel-multi-wrapper">
            <div 
              className="carousel-track" 
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {testimonials.map((testimonial) => (
                <div key={testimonial.id} className="carousel-slide">
                  <div className="avatar-container">
                    <img src={testimonial.avatar} alt={testimonial.name} className="avatar" />
                  </div>
                  <p className="quote">"{testimonial.comment}"</p>
                  <div className="author-info">
                    <h3 className="author">{testimonial.name}</h3>
                    <p className="role">{testimonial.role}</p>
                  </div>
                  <div className="stars">
                    {[...Array(5)].map((_, i) => (
                      <span 
                        key={i} 
                        className={i < testimonial.rating ? 'star-filled' : 'star-empty'}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <button className="arrow next" onClick={nextSlide}>&gt;</button>
        </div>
      </div>
    </section>
  );
};

export default HappyCustomers;