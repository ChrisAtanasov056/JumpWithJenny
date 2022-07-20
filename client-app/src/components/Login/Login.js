import React, { useState } from 'react';
import {  useNavigate } from 'react-router-dom';
import axius from '../../api/axius';
import './Login.module.css';
const REGISTER_URL = '/Account/signup';
const LOGIN_URL = '/Account/login';
export const Login = () => {
  const [ signup, setSignup] = useState({
    username: '',
    password: '',
    email: '',
  })
  const [ login, setLogin] = useState({
    username: '',
    password: '',
  })
  const [errorMessages, setErrorMessages] = useState({});
  const navigate = useNavigate();
  const signupHangler = (e) => {
    setSignup(state => ({
      ...state,
      [e.target.name]: e.target.value
    }))
  }
  const loginHangler = (e) => {
    setLogin(state => ({
      ...state,
      [e.target.name]: e.target.value
    }))
  }
  const onLogin = async (e) => {
    e.preventDefault();
    console.log(login);
    const result = await axius.post(
      LOGIN_URL,
      JSON.stringify(login),
      {
        headers: { 'Content-type': 'application/json' },
        withCredentials: true,
      }
    )
    if (result.status === 200) {
      console.log(result.status)
      navigate('/');
    }
    navigate('/');
  }
  const onCreate = async (e) => {
    e.preventDefault();
    console.log(signup);
    const result = await axius.post(
      REGISTER_URL,
      JSON.stringify(signup),
      {
        headers: { 'Content-type': 'application/json' },
        withCredentials: true,
      }
    )
    if (result.status === 200) {
      navigate('/');
    }
  }
  const renderErrorMessage = (name) =>
  name === errorMessages.name && (
    <div className="error">{errorMessages.message}</div>
  );
  return (
    <section id="login-page" className="auth">
      <div>
        <div className="main">
          <input type="checkbox" id="chk" aria-hidden="true" />
          <div className="signup">
            <form onSubmit={onCreate}>
              <label htmlFor="chk" aria-hidden="true">Sign up</label>
              <input
                id="username"
                type="text"
                name="username"
                placeholder="Username"
                onChange={signupHangler}
                value={signup.username}
                required />
                {renderErrorMessage("username")}
              <input
                id="email"
                type="email"
                name="email"
                placeholder="Email"
                onChange={signupHangler}
                value={signup.email}
                required />
                {renderErrorMessage("email")}
              <input
                id="password"
                type="password"
                name="password"
                placeholder="Password"
                onChange={signupHangler}
                value={signup.password}
                required />
                {renderErrorMessage("password")}
              <button type="submit">Sign up</button>
            </form>
          </div>
          <div className="login">
            <form onSubmit={onLogin}>
              <label htmlFor="chk" aria-hidden="true">Login</label>
              <input
                id="loginUsername"
                type="text"
                name="username"
                placeholder="Username"
                onChange={loginHangler}
                value={login.username}
                required />
                {renderErrorMessage("Username")}
              <input
                id="loginPassword"
                type="password"
                name="password"
                placeholder="Password"
                onChange={loginHangler}
                value={login.password}
                required />
                {renderErrorMessage("Password")}
              <button type="submit">Login</button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}