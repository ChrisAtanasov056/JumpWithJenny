import React from 'react';
import { Link, NavLink } from 'react-router-dom';

export const NavBar = (props) =>{
    return(
<nav className="navbar navbar-expand-lg fixed-top">
        <div className="container">
            <NavLink className="navbar-brand" to="/">Jump With Jenny</NavLink>
            <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false"
                aria-label="Toggle navigation">
                <span className="navbar-toggler-icon"></span>
            </button>

            <div className="collapse navbar-collapse" id="navbarNav">
                <ul className="navbar-nav ml-lg-auto">
                    <li className="nav-item">
                        <NavLink className="nav-link smoothScroll" to="/">Home</NavLink>
                    </li>

                    <li className="nav-item">
                        <a href="#about" className="nav-link smoothScroll">About Us</a>
                    </li>

                    <li className="nav-item">
                        <a href="#className" className="nav-link smoothScroll">Classes</a>
                    </li>

                    <li className="nav-item">
                        <a href="#schedule" className="nav-link smoothScroll">Schedules</a>
                    </li>

                    <li className="nav-item">
                        <a href="#contact" className="nav-link smoothScroll">Contact</a>
                    </li>
                    <li className="nav-item">
                        <NavLink className="nav-link smoothScroll" to="/login">Login</NavLink>
                    </li>
                </ul>

                <ul className="social-icon ml-lg-3">
                    <li><a href="https://fb.com/tooplate" className="fa fa-facebook"></a></li>
                    <li><a href="#" className="fa fa-twitter"></a></li>
                    <li><a href="#" className="fa fa-instagram"></a></li>
                </ul>
            </div>

        </div>
    </nav>
    );
}
