import React from 'react'
import { Route, Routes, Switch  } from 'react-router-dom'
import { NavBar } from './components/NavBar';
import { Login } from './components/Login/Login';
import { Home } from './components/Home'
import './App.css';
const logOut = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
}
/* eslint-disable */
function App() {
  return (
    <div className="App">
      <NavBar />
      <Routes>
        <Route path='/' element={<Home />}  />
        <Route path="/login" element={<Login />} />
        {/* <PrivateRoute exact path="/test" component={Test} /> */}
      </Routes>
      {/* <AuthVerify logOut={logOut} /> */}
    </div>
  );
}

export default App;
