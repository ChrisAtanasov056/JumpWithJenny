import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Home.scss';
import Schedule from '../Schedule/Schedule';
import AboutMe from '../AboutMe/AboutMe';
import FAQ from '../FAQ/FAQ';
import Contacts from '../Contacts/Contacts';
import Footer from '../Footer/Footer';
import Welcome from '../Welcome/Welcome';
import Gallery from '../Gallery/Gallery';
import HappyCustomers from '../HappyCustomers/HappyCustomers';

const Home = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const targetId = location.state?.scrollTo || (location.hash ? location.hash.slice(1) : null);
    if (!targetId) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const rafId = window.requestAnimationFrame(() => {
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
          block: 'start',
        });
      }
      if (location.state?.scrollTo) {
        navigate(`${location.pathname}${location.hash}`, { replace: true, state: {} });
      }
    });

    return () => window.cancelAnimationFrame(rafId);
  }, [location.pathname, location.hash, location.state, navigate]);

  return (
    <div className="home-page">
      <Welcome />
      <AboutMe />
      <Gallery />
      <Schedule />
      <HappyCustomers />
      <FAQ />
      <Contacts />
      <Footer />
    </div>
  );
};

export default Home;
