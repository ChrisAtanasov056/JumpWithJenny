import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import './NotFoundPage.scss';

const NotFoundPage = () => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePosition({
                x: (e.clientX / window.innerWidth) * 100,
                y: (e.clientY / window.innerHeight) * 100
            });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div className="not-found-container">
            <Helmet>
                <meta name="robots" content="noindex, nofollow" />
            </Helmet>
            
            {/* Animated background elements */}
            <div className="background-elements">
                <div 
                    className="floating-shape shape-1" 
                    style={{
                        transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`
                    }}
                ></div>
                <div 
                    className="floating-shape shape-2"
                    style={{
                        transform: `translate(${mousePosition.x * -0.03}px, ${mousePosition.y * -0.03}px)`
                    }}
                ></div>
                <div 
                    className="floating-shape shape-3"
                    style={{
                        transform: `translate(${mousePosition.x * 0.04}px, ${mousePosition.y * 0.01}px)`
                    }}
                ></div>
            </div>

            <div className="not-found-content">
                {/* Animated 404 number */}
                <div className="not-found-code-container">
                    <h1 className="not-found-code">
                        4
                        <span className="zero">0</span>
                        4
                    </h1>
                    <div className="pulse-ring"></div>
                </div>

                {/* Main content */}
                <div className="text-content">
                    <h2 className="not-found-title">
                        Страницата не беше намерена
                    </h2>
                    <p className="not-found-message">
                        Изглежда, че търсеният от Вас адрес не съществува.
                    </p>
                    
                    {/* Animated button */}
                    <Link 
                        to="/" 
                        className={`not-found-link ${isHovered ? 'hovered' : ''}`}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                    >
                        <span className="link-text">
                            Обратно към началната страница
                        </span>
                        <span className="link-arrow">→</span>
                    </Link>
                </div>

                {/* Floating particles */}
                <div className="particles">
                    {[...Array(15)].map((_, i) => (
                        <div 
                            key={i}
                            className="particle"
                            style={{
                                animationDelay: `${i * 0.2}s`,
                                left: `${Math.random() * 100}%`
                            }}
                        ></div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default NotFoundPage;