import React from 'react'
import { Route, Routes, Redirect } from 'react-router-dom'
import { NavBar } from './components/NavBar';
import { Login } from './components/Login/Login';
import { Home } from './components/Home'
import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <div className="App">
      <NavBar />
      <Routes>
                    <Route path='/'  element={<Home />} exact/>
                    <Route path="/login" element={<Login />} exact />
                   
                    <Route path="/logout" render={(props) => {
                        console.log('Logged Out!!!');

                        return <Redirect to="/" />
                    }} />
                </Routes>
    </div>
  );
}

export default App;
