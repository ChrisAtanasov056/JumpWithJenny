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
    window.fbAsyncInit = function () {
      window.FB.init({
        appId: import.meta.env.VITE_APP_FACEBOOK_APP_ID,
        cookie: true,
        xfbml: true,
        version: "v23.0",
      });
      window.fbInitialized = true;
      setIsFbSdkReady(true);
    };

    const script = document.createElement("script");
    script.id = "facebook-jssdk";
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);


    script.onerror = () => {
      console.error("Facebook SDK failed to load");
    };
  }, []);

  return (
    <FacebookSDKContext.Provider value={{ isFbSdkReady }}>
      {children}
    </FacebookSDKContext.Provider>
  );
};

