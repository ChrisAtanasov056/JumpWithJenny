import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Home.scss';
import { useScheduleWorkouts } from '../../hooks/useScheduleWorkouts';
import Welcome from '../Welcome/Welcome';
import Schedule from '../Schedule/Schedule';
import AboutMe from '../AboutMe/AboutMe';
import Gallery from '../Gallery/Gallery';
import HappyCustomers from '../HappyCustomers/HappyCustomers';
import FAQ from '../FAQ/FAQ';
import Contacts from '../Contacts/Contacts';
import Footer from '../Footer/Footer';

const Home = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const scheduleState = useScheduleWorkouts();

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
      <Welcome
        workouts={scheduleState.workouts}
        loadingWorkouts={scheduleState.loading}
      />
      <Schedule externalState={scheduleState} />
      <AboutMe />
      <Gallery />
      <HappyCustomers />
      <FAQ />
      <Contacts />
      <Footer />
    </div>
  );
};

export default Home;
