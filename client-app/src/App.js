// src/App.js

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './services/AuthContext'; // Import useAuth
import Navbar from './components/NavBar/NavBar';
import Home from './components/Home/Home';
import Login from './components/Login/Login';
import Register from './components/Register/Register';
import Schedule from './components/Schedule/Schedule';
import AboutMe from './components/AboutMe/AboutMe';
import FAQ from './components/FAQ/FAQ';
import Contacts from './components/Contacts/Contacts';
import AOS from 'aos'; // Import AOS
import Profile from './components/Profile/Profile';

function App() {
    useEffect(() => {
        AOS.init({
            duration: 1200, // Animation duration
        });
    }, []); // Initialize AOS on component mount

    return (
        <AuthProvider> {/* Wrap your app with AuthProvider */}
            <Router>
                <AppContent />
            </Router>
        </AuthProvider>
    );
}

// Separate component to access Auth context
const AppContent = () => {
    const { user } = useAuth(); // Use the user data from Auth context

    return (
        <>
            <Navbar user={user} /> {/* Pass user data to Navbar */}
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<AboutMe />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/contacts" element={<Contacts />} />
                <Route path="/schedule" element={<Schedule />} />
                <Route path="/login" element={user ? <Profile user={user} /> : <Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/profile" element={user ? <Profile user={user} /> : <Login />} />
            </Routes>
        </>
    );
};

export default App;
