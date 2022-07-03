import React from 'react';
import { About } from './components/About';
import { NavBar } from './components/NavBar';
import { Class } from './components/Class';
import { Schedules } from './components/Schedule';
import { Contacts } from './components/Contacts';
import { Footer } from './components/Footer';
import { Modal } from './components/Modal';

import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <div className="App">
      <NavBar />
      <About />
      <Class />
      <Schedules />
      <Contacts />
      <Footer />
      <Modal />
    </div>
  );
}

export default App;
