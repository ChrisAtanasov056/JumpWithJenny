// src/services/FacebookSDKContext.jsx

import React, { createContext, useContext, useState, useEffect } from 'react';

const FacebookSDKContext = createContext();

export const useFacebookSDK = () => useContext(FacebookSDKContext);

export const FacebookSDKProvider = ({ children }) => {
  const [isFbSdkReady, setIsFbSdkReady] = useState(false);

  useEffect(() => {
    if (document.getElementById("facebook-jssdk")) {
      if (window.FB && window.fbInitialized) {
        setIsFbSdkReady(true);
      }
      return;
    }

    // Инициализираме Promise, която ще се реши, когато SDK е готов
    window.fbAsyncInit = function () {
      window.FB.init({
        appId: import.meta.env.VITE_FACEBOOK_APP_ID, // Вашият App ID
        cookie: true,
        xfbml: true,
        version: "v23.0",
      });
      console.log("Facebook SDK initialized");
      window.fbInitialized = true;
      setIsFbSdkReady(true);
    };

    // Създаваме и добавяме script tag-а на Facebook
    const script = document.createElement("script");
    script.id = "facebook-jssdk";
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      console.log("Facebook SDK script loaded");
    };

    script.onerror = () => {
      console.error("Facebook SDK failed to load");
      // Може да добавите логика за съобщение за грешка
    };
  }, []);

  return (
    <FacebookSDKContext.Provider value={{ isFbSdkReady }}>
      {children}
    </FacebookSDKContext.Provider>
  );
};

