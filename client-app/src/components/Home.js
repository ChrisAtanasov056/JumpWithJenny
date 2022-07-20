import React from 'react';
import { About } from './About';
import { Class } from './Class';
import { Schedules } from './Schedule';
import { Contacts } from './Contacts';
import { Footer } from './Footer';
import { Modal } from './Modal';
/* eslint-disable */
export const Home = () => {
    return (
        <div>
            <About />
            <Class />
            <Schedules />
            <Contacts />
            <Footer />
            <Modal /> 
        </div>

    );
}