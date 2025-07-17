// src/components/Home/Home.js
import React, { useState } from 'react';
import Navbar from '../NavBar/NavBar';
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

  return (
    <div>
      <Navbar/>
      <Welcome/>
      <AboutMe />
      <Gallery />
      <Schedule />
      <HappyCustomers/>
      <FAQ />
      <Contacts />
      <Footer/>
    </div>
  );
};

export default Home;
