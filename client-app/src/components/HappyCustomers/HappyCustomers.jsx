import React, { useState, useEffect } from 'react';
import { FaStar, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import './HappyCustomers.scss';

const testimonials = [
  {
    id: 1,
    name: 'Мария Иванова',
    comment: 'Най-доброто място за тренировки. Персонализиран подход към всеки клиент и видими резултати.',
    rating: 5
  },
  {
    id: 2,
    name: 'Стефка Николова',
    comment: 'Уникално изживяване! Енергията и мотивацията на тренировките са заразителни.',
    rating: 5
  },
  {
    id: 3,
    name: 'Елена Василева',
    comment: 'С всяка тренировка се чувствам все по-силна и уверена. Благодарение на Жени!',
    rating: 5
  },
  {
    id: 4,
    name: 'Антония Стоянова',
    comment: 'Програмите са адаптирани към всякакво ниво. Чувствам се част от страхотна общност.',
    rating: 5
  },
  {
    id: 5,
    name: 'Десислава Георгиева',
    comment: 'Всяка тренировка е истинско удоволствие! Жени, винаги знае как да ни мотивира.',
    rating: 5
  },
  {
    id: 6,
    name: 'Ива Пенева',
    comment: 'Обичам енергията и положителното настроение на тренировките. Перфектно за разтоварване след работа!',
    rating: 4
  },
  {
    id: 7,
    name: 'Надежда Тодорова',
    comment: 'След всеки час се чувствам заредена и вдъхновена.!',
    rating: 5
  },
  {
    id: 8,
    name: 'Кристина Алексиева',
    comment: 'От първата тренировка се влюбих в атмосферата и начина, по който Жени работи с нас.',
    rating: 5
  },
  {
    id: 9,
    name: 'Габриела Илиева',
    comment: 'Страхотна комбинация от забавление и ефективна тренировка! Виждам реална промяна.',
    rating: 5
  },
  {
    id: 10,
    name: 'Ралица Николова',
    comment: 'Това не е просто тренировка – това е начин на живот!',
    rating: 5
  }
];

const HappyCustomers = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Функции за превъртане напред и назад
  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  // Автоматично превъртане на всеки 5 секунди
  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [currentIndex]);

  // Изчислява кои три отзива да се покажат
  const visibleTestimonials = [
    testimonials[(currentIndex + testimonials.length - 1) % testimonials.length], // Предишен
    testimonials[currentIndex], // Текущ (централен)
    testimonials[(currentIndex + 1) % testimonials.length] // Следващ
  ];

  return (
    <div className="happy-customers">
      <h2 className="section-title">Какво казват клиентите?</h2>
      
      <div className="carousel-container">
        {/* Бутони за навигация */}
        <button className="arrow-btn left" onClick={prevSlide}>
          <FaChevronLeft />
        </button>

        <div className="testimonials-list">
          {visibleTestimonials.map((testimonial, index) => (
            <div 
              key={testimonial.id} 
              className={`testimonial-card ${index === 1 ? 'active' : 'inactive'}`}
            >
              <p className="testimonial-comment">"{testimonial.comment}"</p>
              
              <div className="testimonial-author">
                <span className="author-name">{testimonial.name}</span>
                <div className="star-rating">
                  {[...Array(5)].map((_, i) => (
                    <FaStar 
                      key={i} 
                      className={i < testimonial.rating ? 'star filled' : 'star'}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button className="arrow-btn right" onClick={nextSlide}>
          <FaChevronRight />
        </button>
      </div>

      <div className="pagination">
        {testimonials.map((_, i) => (
          <span 
            key={i} 
            className={`dot ${i === currentIndex ? 'active' : ''}`}
            onClick={() => setCurrentIndex(i)}
          />
        ))}
      </div>
    </div>
  );
};

export default HappyCustomers;